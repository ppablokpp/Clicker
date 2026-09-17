// Outside the ship. Home is the inside — the mining, the HUD — and this is
// what's out there when you step through the airlock: the ship itself in
// the middle, berthed in its cradle, the Refinería off to one side and the
// rock you're mining off the other. The whole thing can be dragged and
// pinched from the moment it opens — there's no "adjust view" mode here
// because looking around IS the screen.
//
// Same shell as Home (the sky, the tab bar, the fixed control in the bottom
// right), so stepping out reads as having gone somewhere, not as having
// changed app. Getting out and back in is a confirm and a two-second
// airlock either way, which is what makes it a place rather than a tab.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useClickCounterContext } from '../context/ClickCounterContext'
import { useTreeContext } from '../context/TreeContext'
import { useTimedLuckPowerupContext } from '../context/TimedLuckPowerupContext'
import { useGemUpgradesContext } from '../context/GemUpgradesContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { MATERIAL_ABBREVIATIONS } from '../lib/materialTiers'
import { TRAJECTORY_TIER_THRESHOLDS } from '../lib/trajectory'
import { SpaceStations } from '../components/SpaceStations'
import { FleetReportModal, type FleetReportFigures } from '../components/FleetReportModal'
import { TravelCover } from '../components/TravelCover'
import { TravelModal } from '../components/TravelModal'
import { DockStation, DOCK_SHIP_CENTER } from '../components/DockStation'
import { SpaceObject } from '../components/SpaceObject'
import { useTap } from '../hooks/useTap'
import { EnterGlyph } from '../components/AirlockGlyphs'
import { useAppAuth } from '../hooks/useAppAuth'
import { loadStyleIds } from '../lib/astronautStyles'
import { fetchMyStyle } from '../lib/astronautStyleApi'
import { CORES_PER_TIER } from '../lib/refinery'
import { useCoreRepair, useRefineryContext } from '../context/RefineryContext'
import { getPlace, setPlace } from '../lib/place'

/** How far in you can go. How far out is the opening view, near enough:
 *  ZOOM_OUT_SLACK of it — the scene fits the screen, and that is the
 *  furthest it needs to be. */
const MAX_ZOOM = 2.2
const ZOOM_OUT_SLACK = 0.92
/** How far past the scene's edge the view may drift, in screen px —
 *  enough to feel free, not enough to lose the place; more to the sides,
 *  where the scene is narrow. */
const PAN_SLACK = 140
const PAN_SLACK_X = 150

/** The scene is a column, the way a phone is: the ship at the bottom,
 *  big; the Refinería over it; the Podio, the Vivero and the Tienda
 *  scattered above that; the rock at the very top. All in stage px from
 *  the column's centre line. */
const SHIP_Y = 530
/** The berth's box is placed so the ship itself, not the box, sits here. */
const DOCK_AT = { x: -DOCK_SHIP_CENTER.x, y: SHIP_Y - DOCK_SHIP_CENTER.y }
/** The buildings are drawn at a fraction of their size here — the ship
 *  is the main thing; the Refinería, next to it, a little bigger than the
 *  rest. */
const REFINERY_SCALE = 0.95
const BUILDINGS_SCALE = 0.7
/** Where each building's centre goes, in stage px; SpaceStations takes
 *  them in its own (unscaled) units, so each group's scale is divided out.
 *  The Nodo is built but not placed yet (see SpaceStations' showNode). */
const PLACE = (x: number, y: number, scale: number) => ({ x: x / scale, y: y / scale })
const STATION_LAYOUT = {
  refinery: PLACE(0, 130, REFINERY_SCALE),
  podium: PLACE(205, -220, BUILDINGS_SCALE),
  nursery: PLACE(-235, -120, BUILDINGS_SCALE),
  market: PLACE(-160, -370, BUILDINGS_SCALE),
  node: PLACE(900, -900, BUILDINGS_SCALE),
}
/** The rock, at the top of the column, in stage px, and its size relative
 *  to Home's. */
const ROCK_AT = { x: 0, y: -560 }
const ROCK_SCALE = 1
/** The two groups the buildings are drawn in (stable, for the memo). */
const REFINERY_ONLY: Array<'refinery'> = ['refinery']
const THE_REST: Array<'market' | 'podium' | 'nursery'> = ['market', 'podium', 'nursery']
/** What all of it covers, in stage px — the rock's ring at the top down
 *  to the berth's beam, the Refinería's width — so the view can open with
 *  everything in sight. */
const SCENE = { x: -310, y: -665, w: 620, h: 1485 }
/** Room the view keeps clear: a little at the top, the way-back button at the bottom (there is no tab bar out here). */
const SCENE_INSET = { top: 16, bottom: 20, side: 16 }
/** A press that travels this far is a drag, not a tap. */
const DRAG_SLOP = 8

/** The view that opens with the whole scene in sight — as large as it fits
 *  between the top edge and the tab bar, and at 1× at most. Computed for
 *  the first render, not after it, so the screen is right from its first
 *  frame rather than flashing at 1× and then settling. */
function fitScene() {
  const w = window.innerWidth - SCENE_INSET.side * 2
  const h = window.innerHeight - SCENE_INSET.top - SCENE_INSET.bottom
  const scale = Math.min(1, w / SCENE.w, h / SCENE.h)
  return {
    scale,
    x: -(SCENE.x + SCENE.w / 2) * scale,
    y: -(SCENE.y + SCENE.h / 2) * scale + (SCENE_INSET.top - SCENE_INSET.bottom) / 2,
  }
}

/**
 * Keeps a view on the scene: the zoom between the opening view (a little
 * less) and MAX_ZOOM, and the pan such that the screen never shows more
 * than PAN_SLACK past the scene's edge — where the scene is smaller than
 * the screen on an axis, it is held centred on that axis. A point of the
 * stage lands on screen at centre + pan + scale·point, so the scene's
 * edges on screen are what these bounds are written against.
 */
function clampView(scale: number, x: number, y: number, minZoom: number) {
  const z = Math.min(MAX_ZOOM, Math.max(minZoom, scale))
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  // the screen's usable box: everything, less the way-back button's berth
  const top = SCENE_INSET.top
  const bottom = window.innerHeight - SCENE_INSET.bottom
  const xMax = -cx - z * SCENE.x + PAN_SLACK_X
  const xMin = window.innerWidth - cx - z * (SCENE.x + SCENE.w) - PAN_SLACK_X
  const yMax = top - cy - z * SCENE.y + PAN_SLACK
  const yMin = bottom - cy - z * (SCENE.y + SCENE.h) - PAN_SLACK
  const clampAxis = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)))
  return { scale: z, x: clampAxis(x, xMin, xMax), y: clampAxis(y, yMin, yMax) }
}

// A whole starfield from one 1x1px element — same trick as Home's sky.
function generateStars(count: number, opacity: number): string {
  const stars: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    stars.push(`${x}vw ${y}vh 0 rgba(255,255,255,${opacity})`)
  }
  return stars.join(', ')
}

export function Station() {
  const navigate = useNavigate()
  const { strings } = useLanguage()
  const { prestigeTier, lifetimePlatino } = useClickCounterContext()
  const {
    autoClickCps,
    autoClickLevel,
    luckChance: permanentLuckChance,
    luckMultiplier: permanentLuckMultiplier,
    multiplierValue: baseClickMultiplier,
    tapMultiplierValue,
    multiShotValue,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneCps,
    gunnerLevel,
    gunnerRate,
    gunnerCps,
    autoMultiplierValue,
    offlineProductionValue,
  } = useTreeContext()
  const { active: activeLuckPowerup } = useTimedLuckPowerupContext()
  const { bestOwned: bestMoneyOwned } = useGemUpgradesContext()

  const tierIndex = prestigeTier
  const currentMaterialName = strings.home.trajectoryTierNames[tierIndex]

  // How far along the goal is — the Refinería's reactor runs brighter the
  // closer you are. Same arithmetic as Home's ring, quantized like its glow.
  const level = useMemo(() => {
    const from = TRAJECTORY_TIER_THRESHOLDS[tierIndex]
    const to = TRAJECTORY_TIER_THRESHOLDS[tierIndex + 1]
    const pct = to ? Math.min(1, Math.max(0, (lifetimePlatino - from) / (to - from))) : 1
    return Math.round(pct * 50) / 50
  }, [lifetimePlatino, tierIndex])

  // The fleet report's figures, derived exactly as Home derives them.
  const fleetFigures: FleetReportFigures = {
    currentMaterialName,
    cpsUnit: `${MATERIAL_ABBREVIATIONS[tierIndex]}/s`,
    autoClickLevel,
    autoClickCps,
    scoutDroneLevel,
    scoutDroneRate,
    scoutDroneCps,
    gunnerLevel,
    gunnerRate,
    gunnerCps,
    multiShotValue,
    baseClickMultiplier,
    tapMultiplierValue,
    autoMultiplierValue,
    moneyMultiplier: bestMoneyOwned?.multiplier ?? 1,
    hasLuck: Boolean(permanentLuckChance > 0 || activeLuckPowerup),
    luckChance: Math.max(permanentLuckChance, activeLuckPowerup?.chance ?? 0),
    combinedLuckMultiplier: permanentLuckMultiplier * (activeLuckPowerup?.multiplier ?? 1),
    offlineProductionValue,
  }

  // You only get here by flying (Home sets the place before it navigates).
  // A fresh load on this URL — a reload, a bookmark — has no flight behind
  // it, and the app always opens on the rock, so it goes there instead.
  useEffect(() => {
    if (getPlace() !== 'station') navigate('/', { replace: true })
  }, [navigate])

  const isMaxed = !TRAJECTORY_TIER_THRESHOLDS[tierIndex + 1]

  const rockTap = useTap(() => setLeaving(true))
  const STATION_LABELS = useMemo(
    () => ({
      node: strings.home.stationNode,
      refinery: strings.home.stationRefinery,
      market: strings.home.stationMarket,
      podium: strings.home.stationPodium,
      nursery: strings.home.stationNursery,
    }),
    [strings],
  )

  const { active: smelting } = useCoreRepair()
  const { core } = useRefineryContext()
  // How far the reactor is repaired, for the hatch's glow: capsules loaded
  // over capsules there are, across every material.
  const repair = core ? core.cores.reduce((a, b) => a + b, 0) / (core.cores.length * CORES_PER_TIER) : 0
  // The player's outfit, the way the profile reads it: the local copy first
  // so it paints on the first frame, then the account's own.
  const { getToken: getStyleToken } = useAppAuth()
  const [styleIds, setStyleIds] = useState(() => loadStyleIds())
  useEffect(() => {
    let cancelled = false
    void fetchMyStyle(getStyleToken).then((remote) => {
      if (!cancelled && remote) setStyleIds(remote)
    })
    return () => {
      cancelled = true
    }
  }, [getStyleToken])
  const [showFleet, setShowFleet] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const isAnyModalOpen = showFleet || showReturn || leaving
  useLockBodyScroll(isAnyModalOpen)

  const starsDim = useMemo(() => generateStars(220, 0.5), [])
  const starsBright = useMemo(() => generateStars(60, 0.9), [])

  /* ── the view: pan and zoom, written to CSS variables like Home's ──── */
  const stageRef = useRef<HTMLDivElement>(null)
  const [initialView] = useState(fitScene)
  const viewRef = useRef(initialView)
  // the furthest out the view goes: the opening view, and a little more
  const minZoomRef = useRef(initialView.scale * ZOOM_OUT_SLACK)
  const applyView = useCallback((scale: number, x: number, y: number) => {
    const view = viewRef.current
    const next = clampView(scale, x, y, minZoomRef.current)
    view.scale = next.scale
    view.x = next.x
    view.y = next.y
    const el = stageRef.current
    if (!el) return
    el.style.setProperty('--station-zoom', String(view.scale))
    el.style.setProperty('--station-pan-x', `${view.x}px`)
    el.style.setProperty('--station-pan-y', `${view.y}px`)
  }, [])

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    x: number
    y: number
    originX: number
    originY: number
    dist: number
    scale: number
    midX: number
    midY: number
  } | null>(null)

  const beginGesture = () => {
    const pts = [...pointers.current.values()]
    const view = viewRef.current
    if (pts.length === 1) {
      gesture.current = {
        x: pts[0].x,
        y: pts[0].y,
        originX: view.x,
        originY: view.y,
        dist: 0,
        scale: view.scale,
        midX: 0,
        midY: 0,
      }
    } else if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        originX: view.x,
        originY: view.y,
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      }
    } else {
      gesture.current = null
    }
  }

  // A press anywhere — a building included — can turn into a pan. The stage
  // only captures the pointer once it has travelled, so a press that stays
  // put still reaches the building's own pointerup and counts as a tap.
  const onPointerDown = (e: React.PointerEvent) => {
    if (isAnyModalOpen) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    beginGesture()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      const dx = pts[0].x - g.x
      const dy = pts[0].y - g.y
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        if (Math.hypot(dx, dy) < DRAG_SLOP) return
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      applyView(viewRef.current.scale, g.originX + dx, g.originY + dy)
      return
    }
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId)
    // Pinch: rescale about the fingers' midpoint, keeping what's under it
    // pinned there — `centre + pan + scale·point` rearranged, as in Home.
    const [a, b] = pts
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    const next = Math.min(MAX_ZOOM, Math.max(minZoomRef.current, (g.scale * dist) / Math.max(1, g.dist)))
    const ratio = next / g.scale
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    applyView(next, midX - cx - ratio * (g.midX - cx - g.originX), midY - cy - ratio * (g.midY - cy - g.originY))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    beginGesture()
  }

  // Mouse wheel: a step proportional to the current zoom, about the cursor.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isAnyModalOpen) return
      e.preventDefault()
      const from = { ...viewRef.current }
      const next = Math.min(MAX_ZOOM, Math.max(minZoomRef.current, from.scale * (1 - e.deltaY * 0.001)))
      const ratio = next / from.scale
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      applyView(
        next,
        e.clientX - cx - ratio * (e.clientX - cx - from.x),
        e.clientY - cy - ratio * (e.clientY - cy - from.y),
      )
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [applyView, isAnyModalOpen])

  const s = strings.station

  return (
    <div
      className="relative flex h-[100dvh] w-full touch-none select-none flex-col items-center justify-center overflow-hidden bg-[#08080c]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsDim }} />
        <div className="animate-twinkle absolute h-px w-px rounded-full bg-white" style={{ boxShadow: starsBright }} />
      </div>

      {/* The stage: everything that moves with the view. z-0 under the tab
          bar, like Home's. */}
      <div
        ref={stageRef}
        className="pointer-events-none relative z-0 flex flex-col items-center"
        style={
          {
            '--station-zoom': String(initialView.scale),
            '--station-pan-x': `${initialView.x}px`,
            '--station-pan-y': `${initialView.y}px`,
            transform: 'translate(var(--station-pan-x, 0px), var(--station-pan-y, 0px)) scale(var(--station-zoom, 1))',
          } as React.CSSProperties
        }
      >
        <div className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
          {/* the buildings, small: each group scaled about the scene's
              centre, so their offsets scale with them — the Refinería on
              its own, bigger */}
          <div className="pointer-events-none absolute inset-0" style={{ transform: `scale(${REFINERY_SCALE})` }}>
            <SpaceStations
              tierIndex={tierIndex}
              fleet={autoClickLevel + scoutDroneLevel}
              level={level}
              paused={isAnyModalOpen}
              smelting={smelting}
              offsets={STATION_LAYOUT}
              labels={STATION_LABELS}
              only={REFINERY_ONLY}
              onOpenFleet={() => setShowFleet(true)}
              onOpenRefinery={() => navigate('/refineria')}
              onOpenMarket={() => navigate('/tienda')}
              onOpenPodium={() => navigate('/clasificacion')}
              onOpenNursery={() => navigate('/arbol')}
            />
          </div>
          <div className="pointer-events-none absolute inset-0" style={{ transform: `scale(${BUILDINGS_SCALE})` }}>
            <SpaceStations
              tierIndex={tierIndex}
              fleet={autoClickLevel + scoutDroneLevel}
              level={level}
              paused={isAnyModalOpen}
              smelting={smelting}
              offsets={STATION_LAYOUT}
              labels={STATION_LABELS}
              only={THE_REST}
              onOpenFleet={() => setShowFleet(true)}
              onOpenRefinery={() => navigate('/refineria')}
              onOpenMarket={() => navigate('/tienda')}
              onOpenPodium={() => navigate('/clasificacion')}
              onOpenNursery={() => navigate('/arbol')}
              showNursery
            />
          </div>
          {/* the rock, the same one Home has, over the ship: tap it and you
              go back in — the airlock, then the screen with the rock in it */}
          <div
            role="button"
            aria-label={s.returnLabel}
            className="pointer-events-auto absolute flex h-52 w-52 cursor-pointer items-center justify-center"
            style={{
              left: `calc(50% + ${ROCK_AT.x}px)`,
              top: `calc(50% + ${ROCK_AT.y}px)`,
              transform: `translate(-50%, -50%) scale(${ROCK_SCALE})`,
            }}
            {...rockTap}
          >
            <SpaceObject
              tierIndex={tierIndex}
              pct={level}
              isMaxed={isMaxed}
              paused={isAnyModalOpen}
              idPrefix="station"
            />
          </div>
          <DockStation
            paused={isAnyModalOpen}
            label={strings.home.stationDock}
            at={DOCK_AT}
            styleIds={styleIds}
            repair={repair}
            onTap={() => navigate('/nave')}
            astronautLabel={strings.home.stationAstronaut}
            onTapAstronaut={() => navigate('/estadisticas')}
          />
        </div>
      </div>

      {/* Back inside — the same berth Home's airlock button uses. */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col gap-1.5 sm:bottom-28 sm:right-6">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setShowReturn(true)}
          aria-label={s.returnLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/20 text-violet-200 backdrop-blur-xl transition-colors hover:bg-violet-500/30"
        >
          <EnterGlyph size={16} />
        </button>
      </div>

      {showReturn && (
        <TravelModal
          title={s.returnTitle}
          body={s.returnBody}
          confirm={s.returnGo}
          cancel={s.cancel}
          onConfirm={() => {
            setShowReturn(false)
            setLeaving(true)
          }}
          onClose={() => setShowReturn(false)}
        />
      )}
      {leaving && (
        <TravelCover
          steps={s.returnSteps}
          onDone={() => {
            setPlace('asteroid')
            navigate('/', { replace: true })
          }}
        />
      )}

      {showFleet && <FleetReportModal figures={fleetFigures} onClose={() => setShowFleet(false)} />}
    </div>
  )
}
