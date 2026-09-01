import { useAuth } from '@clerk/expo'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { toLocalDateString } from '../lib/date'
import { applyObjectProgress } from '../lib/spaceObjects'
import { clearPendingClicks, loadPendingClicks, savePendingClicks } from '../lib/pendingClicksStorage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
// How often the local buffer actually reaches the server. Was 1000ms; at
// that cadence a purchase/claim's own request always saw an up-to-date
// server total "for free". Now that it's 30s, every action that checks a
// click-derived balance/threshold server-side (buying a tree node, claiming
// a task, etc.) has to force a flush first — see flushNow below — or it
// could wrongly reject something the player can clearly afford on screen,
// using a total that's up to 30s stale.
const FLUSH_INTERVAL_MS = 30_000
// How often the *unflushed* buffer gets written to AsyncStorage — a
// durability net for the case the AppState-background flush can't catch (a
// crash, a force-quit, the OS killing the app), now that up to 30s of real
// progress can be sitting unflushed at any moment. Deliberately more
// frequent than the server flush itself, since this is a cheap local write,
// not a network request.
const PERSIST_INTERVAL_MS = 5_000
const CPS_WINDOW_MS = 2000
// Must match back/src/routes/clicks.js's MAX_CLICKS_PER_REQUEST — the
// backend rejects a single increment larger than this, so flush() has to
// split anything bigger into several requests instead of sending it all at
// once (high multipliers can pile up thousands of pending clicks between ticks).
const MAX_CLICKS_PER_REQUEST = 150_000

/**
 * The database is the source of truth for where the count *starts*, but the
 * displayed number is always `confirmed + pending` computed locally — it
 * never gets overwritten by a server response, only added to. That keeps
 * clicks feeling instant even if a flush is slow: a flush only ever
 * subtracts the exact amount it sent from `pending`, so clicks that landed
 * mid-flight stay visible instead of being clobbered by a stale total.
 *
 * Ported from front/src/hooks/useClickCounter.ts — identical logic, only
 * the platform-specific bits changed: @clerk/expo instead of
 * @clerk/clerk-react, react-native's AppState instead of the browser's
 * visibilitychange/pagehide events, and AsyncStorage instead of
 * localStorage for the pending-buffer durability layer.
 */
export function useClickCounter() {
  const { userId, getToken } = useAuth()
  const [totalClicks, setTotalClicks] = useState(0)
  // Trayectoria's own progress stat — cumulative platino ever earned, never
  // reduced by spending (see migration 028). Unlike totalClicks this has no
  // local pending/predicted overlay: it's a slow-moving achievement number,
  // not something read in real time, so "whatever the last server response
  // said" is close enough — just refreshed on mount and on every click flush.
  const [lifetimePlatino, setLifetimePlatino] = useState(0)
  // Trayectoria's *confirmed* tier — only ever advances via confirmPrestige
  // below, never just from lifetimePlatino crossing the next threshold, so
  // the player keeps their current tier's material until they explicitly
  // choose to move on.
  const [prestigeTier, setPrestigeTier] = useState(0)
  const [isConfirmingPrestige, setIsConfirmingPrestige] = useState(false)
  const [clicksPerSecond, setClicksPerSecond] = useState(0)
  // Every /increment response includes the current keys/gems totals (a
  // magnet powerup can silently grant either mid-flush) — exposed here so
  // KeysContext/GemsContext (nested inside this provider) can sync off of
  // it without this hook needing to know they exist.
  const [latestKeys, setLatestKeys] = useState<number | null>(null)
  const [latestGems, setLatestGems] = useState<number | null>(null)
  // The space object on Home — how many have been broken (the new prestige
  // driver) and how far into the current one. Predicted the exact same way
  // totalClicks is (confirmed server value + whatever's pending locally),
  // via applyObjectProgress rolling the pending amount through the same
  // cost curve the backend uses — so the ring/object update instantly per
  // tap instead of waiting for the next flush.
  const [objectsBroken, setObjectsBroken] = useState(0)
  const [objectProgress, setObjectProgress] = useState(0)
  const objectsBrokenConfirmedRef = useRef(0)
  const objectProgressConfirmedRef = useRef(0)
  const recentClicksRef = useRef<number[]>([])
  const confirmedRef = useRef(0)
  const pendingRef = useRef(0)
  // Genuine screen taps only — always +1 per registerClick call, regardless
  // of the (possibly multiplied) `amount` it's given. Drained in lockstep
  // with pendingRef, capped per-chunk at that chunk's amountSent so it can
  // never report more real taps than the multiplied total it rode along with.
  const pendingRealClicksRef = useRef(0)
  // How many of those real taps landed a Destello (the Suerte/Telescopio
  // proc — see Home's isLucky), for the "Encuentra destellos" task. Same
  // trust/drain shape as pendingRealClicksRef: reported and clamped against
  // realClicks server-side (see routes/clicks.js), never rolled or verified
  // there since the roll itself is client-side per tap.
  const pendingLuckyHitsRef = useRef(0)
  const confirmedLuckyHitsRef = useRef(0)
  const [luckyClicksFound, setLuckyClicksFound] = useState(0)
  // Purely a display prediction for auto-click production (see TreeContext)
  // — ticks up locally between the infrequent real accrual polls so the
  // number feels alive, then gets zeroed out by syncTotalClicks every time
  // an authoritative total lands (that total already includes whatever was
  // predicted, so keeping the local guess around after that would double-count it).
  const autoPendingRef = useRef(0)
  // Holds the in-flight flush's own promise, not just a boolean — a second
  // caller (e.g. a purchase's flushNow(), see below) needs to actually
  // *wait* for an already-running flush to finish and join its result,
  // rather than the old boolean-guard's silent no-op, which would have let
  // a purchase fire against a stale total while a periodic flush happened
  // to already be in flight.
  const flushPromiseRef = useRef<Promise<boolean> | null>(null)
  const peakCpsRef = useRef(0)
  // Lets a case-opening reel hide the real total behind its reveal
  // animation instead of letting an unrelated background sync (e.g.
  // auto-click's own poll landing mid-spin) jump the counter and spoil the
  // prize before the reel visually lands on it. Nestable — only actually
  // resumes once every caller has released it. Doesn't touch pendingRef or
  // taps in flight, only when a *synced* (server-authoritative) total is
  // allowed to become visible.
  const suspendSyncCountRef = useRef(0)
  const pendingSyncTotalRef = useRef<number | null>(null)
  // Reactive mirror of suspendSyncCountRef > 0 — a ref mutation alone
  // wouldn't re-render anything, but the bottom nav needs to actually know
  // a reveal animation is in flight so it can block navigation away from it.
  const [isSyncSuspended, setIsSyncSuspended] = useState(false)

  // Recomputes the displayed object state from confirmed + pending, same
  // shape as the totalClicks setter calls below — call this alongside every
  // one of those instead of only on real server responses.
  const updateObjectDisplay = useCallback(() => {
    const totalPending = pendingRef.current + autoPendingRef.current
    const predicted = applyObjectProgress(
      objectsBrokenConfirmedRef.current,
      0,
      objectProgressConfirmedRef.current + totalPending,
    )
    setObjectsBroken(predicted.objectsBroken)
    setObjectProgress(predicted.objectProgress)
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/api/clicks/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          confirmedRef.current = data.totalClicks
          setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
          if (typeof data.lifetimePlatino === 'number') setLifetimePlatino(data.lifetimePlatino)
          if (typeof data.prestigeTier === 'number') setPrestigeTier(data.prestigeTier)
          if (typeof data.objectsBroken === 'number') objectsBrokenConfirmedRef.current = data.objectsBroken
          if (typeof data.objectProgress === 'number') objectProgressConfirmedRef.current = data.objectProgress
          if (typeof data.luckyClicksFound === 'number') {
            confirmedLuckyHitsRef.current = data.luckyClicksFound
            setLuckyClicksFound(data.luckyClicksFound)
          }
          updateObjectDisplay()
        }
      } catch (err) {
        console.error('No se pudo cargar el contador desde el servidor', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, getToken, updateObjectDisplay])

  // Replays whatever didn't make it to the server before the app last
  // closed (see pendingClicksStorage.ts) — e.g. a crash, a force-quit,
  // anything that skips the AppState-background flush below. Assignment
  // (`=`), not addition: this only ever runs once per sign-in, while every
  // pending ref is still at its freshly-initialized 0, so it's naturally
  // idempotent against a double-invoke of this effect (running it twice
  // sets the same values both times instead of double-counting a phantom
  // extra flush's worth of clicks).
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const persisted = await loadPendingClicks(userId)
      if (cancelled || !persisted) return
      pendingRef.current = persisted.pending
      pendingRealClicksRef.current = persisted.pendingRealClicks
      pendingLuckyHitsRef.current = persisted.pendingLuckyHits
      peakCpsRef.current = Math.max(peakCpsRef.current, persisted.peakCps)
      setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
      if (persisted.pendingLuckyHits > 0) {
        setLuckyClicksFound(confirmedLuckyHitsRef.current + pendingLuckyHitsRef.current)
      }
      updateObjectDisplay()
    })()
    return () => {
      cancelled = true
    }
  }, [userId, updateObjectDisplay])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      recentClicksRef.current = recentClicksRef.current.filter((t) => now - t < CPS_WINDOW_MS)
      const cps = recentClicksRef.current.length / (CPS_WINDOW_MS / 1000)
      if (cps > peakCpsRef.current) peakCpsRef.current = cps
      setClicksPerSecond(cps)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // The actual network flush — factored out of `flush` so `flush` itself
  // can stay a thin "join the in-flight one, or start a new one" wrapper
  // (see flushPromiseRef's own comment for why that distinction matters now
  // that purchases need to force a flush and *wait* for it).
  // Sends AT MOST one <=MAX_CLICKS_PER_REQUEST chunk — deliberately never
  // loops internally. A rapid-tapping session with high multipliers can
  // pile up well over 5000 "amount" within one 30s window; looping here
  // would fire several increment requests back to back the moment that
  // happens — real, sustained JS-thread work competing with the very
  // tapping that caused it (audio/gesture/view-update bridge crossings are
  // already the hot path on mobile — see TapShootLayer's own history — a
  // burst of increment round trips landing in the middle of that is exactly
  // the kind of thing that visibly chokes a long session). Returns whether
  // it actually succeeded (or had nothing to do) — `flushNow` below uses
  // that to know whether it's safe to try another chunk or should give up.
  const runFlushChunk = useCallback(async (): Promise<boolean> => {
    if (pendingRef.current === 0 || !userId) return true
    try {
      const token = await getToken()
      const amountSent = Math.min(pendingRef.current, MAX_CLICKS_PER_REQUEST)
      const realClicksSent = Math.min(pendingRealClicksRef.current, amountSent)
      const luckyHitsSent = Math.min(pendingLuckyHitsRef.current, realClicksSent)
      const res = await fetch(`${API_URL}/api/clicks/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: amountSent,
          realClicks: realClicksSent,
          luckyHits: luckyHitsSent,
          peakCps: peakCpsRef.current,
          localDate: toLocalDateString(new Date()),
        }),
      })
      if (!res.ok) return false // stays in pendingRef, retried next tick
      const data = await res.json()
      confirmedRef.current = data.totalClicks
      pendingRef.current -= amountSent
      pendingRealClicksRef.current -= realClicksSent
      pendingLuckyHitsRef.current -= luckyHitsSent
      setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
      if (typeof data.lifetimePlatino === 'number') setLifetimePlatino(data.lifetimePlatino)
      if (typeof data.keys === 'number') setLatestKeys(data.keys)
      if (typeof data.gems === 'number') setLatestGems(data.gems)
      if (typeof data.luckyClicksFound === 'number') {
        confirmedLuckyHitsRef.current = data.luckyClicksFound
        setLuckyClicksFound(data.luckyClicksFound)
      }
      if (typeof data.objectsBroken === 'number') objectsBrokenConfirmedRef.current = data.objectsBroken
      if (typeof data.objectProgress === 'number') objectProgressConfirmedRef.current = data.objectProgress
      updateObjectDisplay()
      // Whatever AsyncStorage currently holds is now stale — reconcile it
      // to match reality instead of waiting for the next 5s persist tick.
      if (userId) {
        await savePendingClicks(userId, {
          pending: pendingRef.current,
          pendingRealClicks: pendingRealClicksRef.current,
          pendingLuckyHits: pendingLuckyHitsRef.current,
          peakCps: peakCpsRef.current,
        })
      }
      return true
    } catch (err) {
      console.error('No se pudo guardar el progreso de clicks', err)
      return false
    }
  }, [userId, getToken, updateObjectDisplay])

  // The periodic/background flush entry point — safe to call concurrently
  // from multiple places (the 30s timer, flushNow below, the background
  // handler): a second caller while one's already running joins the same
  // promise instead of firing a duplicate overlapping request. Always sends
  // at most one chunk (see runFlushChunk) — this is the "keep the buffer
  // roughly caught up" call, not a "guarantee it's fully caught up" one.
  const flush = useCallback((): Promise<boolean> => {
    if (!flushPromiseRef.current) {
      flushPromiseRef.current = runFlushChunk().finally(() => {
        flushPromiseRef.current = null
      })
    }
    return flushPromiseRef.current
  }, [runFlushChunk])

  // For any action whose own request checks a click-derived balance or
  // threshold server-side (buying a tree node, claiming a task...) — forces
  // the local buffer to be *fully* caught up with the server before that
  // action's own request fires, so it never gets evaluated against a total
  // that's stale by any amount. Unlike the periodic `flush()` (capped to
  // one chunk per call, so normal play never bursts several requests at
  // once), this repeatedly calls `flush()` — transparently joining whatever
  // is already in flight each time — until nothing's left pending. That
  // loop is limited only by network round-trip time, not FLUSH_INTERVAL_MS,
  // so it stays fast even for a large backlog; it gives up (rather than
  // spinning forever hammering a dead network) the moment a chunk actually
  // fails, and never throws — a network hiccup here just means the action
  // proceeds against the last-known total (the same behavior every action
  // already had before this existed), not that the action becomes
  // impossible.
  const flushNow = useCallback(async () => {
    while (pendingRef.current > 0) {
      const ok = await flush()
      if (!ok) break
    }
  }, [flush])

  // `flush` isn't a stable reference (it depends on `getToken`, which Clerk
  // hands back fresh every render, and this hook's own state updates on
  // every tap/tick re-render it) — routed through a ref for the same reason
  // TreeContext's own poll now is: putting `flush` directly in an
  // interval/listener effect's deps would tear it down and re-subscribe on
  // every one of those re-renders instead of ever letting it run
  // undisturbed. This one is *not* just wasteful housekeeping like the web
  // version's own equivalent comment says — on RN, the AppState effect
  // below was actually re-subscribing (and its cleanup firing a real
  // flush()) roughly every TICK_INTERVAL_MS while any auto-click production
  // was active, i.e. dozens of times more often than the intended 30s
  // cadence, quietly defeating the one-chunk-per-tick burst limit runFlush
  // is built around.
  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  useEffect(() => {
    const interval = setInterval(() => flushRef.current(), FLUSH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // Persists the *unflushed* buffer only — the confirmed total always comes
  // fresh from the server on load, so there's nothing to gain persisting it
  // — on a short interval so a crash between server flushes doesn't lose
  // more than a few seconds of real progress (see pendingClicksStorage.ts).
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => {
      void savePendingClicks(userId, {
        pending: pendingRef.current,
        pendingRealClicks: pendingRealClicksRef.current,
        pendingLuckyHits: pendingLuckyHitsRef.current,
        peakCps: peakCpsRef.current,
      })
    }, PERSIST_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [userId])

  // RN's analog of the web version's visibilitychange/pagehide listeners —
  // flush right away whenever the app is backgrounded (home button, app
  // switcher, incoming call) instead of waiting up to FLUSH_INTERVAL_MS,
  // and once more on unmount for the same reason pagehide covered there.
  // Also persists the current buffer to AsyncStorage synchronously-ish
  // (fire-and-forget, but kicked off before the network flush) as a second
  // line of defense in case the app gets killed before that flush resolves.
  useEffect(() => {
    const onBackground = () => {
      if (userId) {
        void savePendingClicks(userId, {
          pending: pendingRef.current,
          pendingRealClicks: pendingRealClicksRef.current,
          pendingLuckyHits: pendingLuckyHitsRef.current,
          peakCps: peakCpsRef.current,
        })
      }
      flushRef.current()
    }
    const onChange = (state: AppStateStatus) => {
      if (state !== 'active') onBackground()
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => {
      sub.remove()
      onBackground()
    }
  }, [userId])

  const registerClick = useCallback(
    (amount = 1, isLucky = false) => {
      if (!userId) return
      recentClicksRef.current.push(Date.now())
      pendingRef.current += amount
      pendingRealClicksRef.current += 1
      if (isLucky) {
        pendingLuckyHitsRef.current += 1
        setLuckyClicksFound(confirmedLuckyHitsRef.current + pendingLuckyHitsRef.current)
      }
      setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
      // No updateObjectDisplay() here on purpose — objectsBroken/
      // objectProgress aren't rendered anywhere in the mobile app yet, so
      // recomputing them (a real while-loop, plus two more setState calls)
      // on literally every tap was pure waste on the single hottest path in
      // the app, competing for JS thread time with things that *do* need it
      // (the 200ms clicksPerSecond interval, which is timer-driven and gets
      // visibly delayed/choppy if the thread is busy right when it's due to
      // fire). They still stay correct via syncObjectState and the
      // fetch/flush responses below — just not re-predicted locally on
      // every single click anymore. Revisit if a screen ever needs to show
      // live "asteroid crack" progress on mobile.
    },
    [userId],
  )

  // Other places that spend clicks server-side (buying a powerup or a
  // permanent upgrade) return the fresh authoritative total — this folds it
  // in immediately instead of waiting for the next click-driven flush, which
  // might never come if nothing gets clicked again right away. Also drops
  // any predicted auto-click amount, since the new total already accounts
  // for everything up to now.
  const syncTotalClicks = useCallback((newTotal: number) => {
    if (suspendSyncCountRef.current > 0) {
      // Still the last-write-wins semantics a normal call would have — just
      // held back from the display until whatever's suspending it resumes.
      pendingSyncTotalRef.current = newTotal
      return
    }
    confirmedRef.current = newTotal
    autoPendingRef.current = 0
    setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current))
  }, [])

  // For read-only background polls (TreeContext's own periodic /api/tree/me,
  // not a spend/earn action) — those race against the independent click
  // flush cycle with no ordering guarantee between the two round trips. A
  // poll response can carry a server snapshot taken *before* a flush that
  // has since landed and already moved confirmedRef forward, and arrive
  // *after* that flush's own response — blindly overwriting with it would
  // yank the displayed total backwards mid-session even though nothing was
  // ever actually spent. A genuine spend already goes through syncTotalClicks
  // above via that action's own response, so it's safe for a passive poll
  // to simply never move the total backwards.
  const syncTotalClicksIfNewer = useCallback((newTotal: number) => {
    if (suspendSyncCountRef.current > 0) {
      if (pendingSyncTotalRef.current === null || newTotal > pendingSyncTotalRef.current) {
        pendingSyncTotalRef.current = newTotal
      }
      return
    }
    if (newTotal <= confirmedRef.current) return
    confirmedRef.current = newTotal
    autoPendingRef.current = 0
    setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current))
  }, [])

  // Other endpoints that credit clicks server-side (auto-click accrual in
  // TreeContext) also return the fresh objectsBroken/objectProgress — folds
  // that in as the new confirmed base, same as syncTotalClicks does for the
  // currency total, then re-predicts on top of it.
  const syncObjectState = useCallback(
    (newObjectsBroken: number, newObjectProgress: number) => {
      objectsBrokenConfirmedRef.current = newObjectsBroken
      objectProgressConfirmedRef.current = newObjectProgress
      updateObjectDisplay()
    },
    [updateObjectDisplay],
  )

  // Trayectoria's manual prestige step. Server re-validates eligibility
  // (never trust the client's own idea of "ready") and is the sole source
  // of truth for total_clicks resetting to 0 here — this just folds that
  // authoritative result straight in, same as syncTotalClicks does for a
  // spend, rather than assuming success and zeroing locally first.
  const confirmPrestige = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) return { ok: false, error: 'not-signed-in' }
    setIsConfirmingPrestige(true)
    try {
      // Prestige checks lifetime_platino against a tier threshold — a
      // click-derived value, so it needs the same pre-flush every other
      // click-gated action gets (see flushNow's own comment).
      await flushNow()
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/clicks/prestige`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'error' }
      confirmedRef.current = data.totalClicks
      pendingRef.current = 0
      pendingRealClicksRef.current = 0
      autoPendingRef.current = 0
      await clearPendingClicks(userId)
      setTotalClicks(data.totalClicks)
      setPrestigeTier(data.prestigeTier)
      if (typeof data.lifetimePlatino === 'number') setLifetimePlatino(data.lifetimePlatino)
      return { ok: true }
    } catch (err) {
      console.error('No se pudo cambiar de prestigio', err)
      return { ok: false, error: 'error' }
    } finally {
      setIsConfirmingPrestige(false)
    }
  }, [userId, getToken, flushNow])

  const suspendSync = useCallback(() => {
    suspendSyncCountRef.current += 1
    setIsSyncSuspended(true)
  }, [])

  const resumeSync = useCallback(() => {
    suspendSyncCountRef.current = Math.max(0, suspendSyncCountRef.current - 1)
    if (suspendSyncCountRef.current === 0) {
      setIsSyncSuspended(false)
      if (pendingSyncTotalRef.current !== null) {
        const total = pendingSyncTotalRef.current
        pendingSyncTotalRef.current = null
        confirmedRef.current = total
        autoPendingRef.current = 0
        setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current))
      }
    }
  }, [])

  // Purely visual — ticks the displayed total up between the infrequent
  // real auto-click accrual polls (see TreeContext) without touching
  // pendingRef, so it's never sent to /increment and never mistaken for a
  // real tap (real-clicks stat, streak, etc. stay untouched by this).
  const tickAutoClicks = useCallback((amount: number) => {
    autoPendingRef.current += amount
    setTotalClicks(Math.floor(confirmedRef.current + pendingRef.current + autoPendingRef.current))
    // No updateObjectDisplay() here either — this runs every 100ms
    // continuously whenever the player owns any auto-click production, so
    // it's the *other* hot path this same waste was quietly running on. See
    // registerClick's own comment for the full reasoning.
  }, [])

  // Memoized — this is the ClickCounterContext Provider's own `value` prop
  // (see ClickCounterContext.tsx), and it used to be rebuilt as a brand new
  // object literal on *every* render of this hook, including every single
  // `setTotalClicks` call (i.e. every tap). Since React Context re-renders
  // every consumer whenever the `value` reference changes — regardless of
  // whether the specific fields that consumer reads actually changed — an
  // unmemoized value here meant every tap re-rendered every single
  // ClickCounterContext consumer across the *entire app* (TreeContext,
  // GemsContext, TasksContext, the always-mounted bottom nav bar, and any
  // other screen still mounted in the background), not just Home. That's
  // the real, primary source of the lag/audio-delay that scaled with tap
  // rate — not the touch/gesture mechanics, which were a much smaller cost
  // by comparison once this was found.
  return useMemo(
    () => ({
      totalClicks,
      lifetimePlatino,
      prestigeTier,
      isConfirmingPrestige,
      confirmPrestige,
      clicksPerSecond,
      registerClick,
      syncTotalClicks,
      syncTotalClicksIfNewer,
      tickAutoClicks,
      suspendSync,
      resumeSync,
      isSyncSuspended,
      latestKeys,
      latestGems,
      objectsBroken,
      objectProgress,
      syncObjectState,
      luckyClicksFound,
      flushNow,
    }),
    [
      totalClicks,
      lifetimePlatino,
      prestigeTier,
      isConfirmingPrestige,
      confirmPrestige,
      clicksPerSecond,
      registerClick,
      syncTotalClicks,
      syncTotalClicksIfNewer,
      tickAutoClicks,
      suspendSync,
      resumeSync,
      isSyncSuspended,
      latestKeys,
      latestGems,
      objectsBroken,
      objectProgress,
      syncObjectState,
      luckyClicksFound,
      flushNow,
    ],
  )
}
