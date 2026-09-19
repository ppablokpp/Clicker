import { useState, type ReactNode } from 'react'
import { playPageTurn } from '../lib/caseSound'

/**
 * An open notebook. Two leaves on a dark cover, the spine down the middle:
 * the right leaf is the page you are on, the left one blank. A page turns
 * about the spine, in perspective, its blank back landing on the left
 * leaf — the way paper does — so the turn is the whole turn. On a phone the right leaf is centred and the left one
 * runs off the edge; on a wider screen the spread shows whole.
 *
 * Everything you touch is drawn on the paper: the arrows in the corners
 * turn the pages, the cross in the top corner closes the book. Tapping
 * the page's right or left half turns it too. Index tabs stick out of the
 * right edge, one per section: tapping one turns straight to that
 * section's first page. A tab is glued to that first page, so it goes
 * where the page goes: it shows while its page is still on the right,
 * rides the leaf when that page turns, and is gone once it's been turned.
 */

export interface DiaryPage {
  /** The running head, small, at the top of the page. */
  head: string
  /** The section's tab: pages sharing an id share a tab, drawn with its icon. */
  tab: 'report' | 'manual' | 'route'
  content: ReactNode
}

const TURN_MS = 700
const INK = '#3d3830'
const FAINT = '#8a8070'

export function DiaryBook({ pages, font, onClose }: { pages: DiaryPage[]; font: string; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  // A turn in flight: which way, from which page, to which. A tab can
  // jump several pages at once; it still turns one sheet — the one that
  // lifts (forward) or lands (back) — with the destination underneath.
  const [turn, setTurn] = useState<{ dir: 1 | -1; from: number; to: number } | null>(null)

  const jumpTo = (to: number) => {
    if (turn || to === index || to < 0 || to >= pages.length) return
    setTurn({ dir: to > index ? 1 : -1, from: index, to })
    playPageTurn()
  }
  const go = (dir: 1 | -1) => jumpTo(index + dir)
  // The turn ends when its animation does — not on a timer that could fire
  // a frame early and drop the leaf mid-air.
  const finishTurn = () => {
    if (!turn) return
    setIndex(turn.to)
    setTurn(null)
  }

  // What the right leaf shows under a turn. Forward: the leaf lifting off
  // it (carrying the page we leave) reveals the destination there. Back:
  // the leaf (carrying the destination) lands on it over the current
  // page, which stays until it does. The left leaf is always blank — the
  // book is written on its right-hand pages only — and so is the back of
  // every sheet.
  const rightIndex = turn ? (turn.dir === 1 ? turn.to : turn.from) : index
  const leafIndex = turn ? (turn.dir === 1 ? turn.from : turn.to) : null
  const canBack = index > 0 && !turn
  const canNext = index < pages.length - 1 && !turn

  // The tabs: one per section, at the first page that carries its label.
  const tabs = pages.reduce<{ id: DiaryPage['tab']; first: number }[]>((acc, page, i) => {
    if (!acc.some((t) => t.id === page.tab)) acc.push({ id: page.tab, first: i })
    return acc
  }, [])
  // A tab is glued to its section's first page. On the right-hand stack it
  // shows while that page is on the right: under the leaf turning (still
  // to come), or on top (the page you are on). The one glued to the leaf
  // that is turning rides with it (rendered on the leaf, below), and a
  // page already turned has taken its tab to the left with it.
  const stackTabs = tabs.filter((t) =>
    turn ? (turn.dir === 1 ? t.first > turn.from : t.first >= turn.from) : t.first >= index,
  )
  const leafTab = leafIndex === null ? null : (tabs.find((t) => t.first === leafIndex) ?? null)
  // a tab's slot on the edge, fixed by its order, so a tab never shifts
  const slotTop = (tab: (typeof tabs)[number]) => 40 + tabs.indexOf(tab) * 70

  return (
    <div className="relative shrink-0 -translate-x-[11.5rem] sm:translate-x-0" style={{ width: '46rem' }}>
      {/* the cover */}
      <div
        className="relative rounded-2xl px-2.5 pb-2.5 pt-2.5"
        style={{
          background: 'linear-gradient(180deg, #2a1f3d 0%, #1d1729 40%, #191423 100%)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="relative flex" style={{ perspective: '1600px' }}>
          {/* the left leaf */}
          <div className="relative w-1/2">
            <span className="pointer-events-none absolute inset-0 translate-x-[-3px] translate-y-[3px] rounded-l-md bg-[#d9cfb8]" />
            <span className="pointer-events-none absolute inset-0 translate-x-[-1.5px] translate-y-[1.5px] rounded-l-md bg-[#e6dcc4]" />
            <Leaf side="left" page={null} font={font} />
          </div>
          {/* the right leaf */}
          <div className="relative w-1/2">
            <span className="pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-r-md bg-[#d9cfb8]" />
            <span className="pointer-events-none absolute inset-0 translate-x-[1.5px] translate-y-[1.5px] rounded-r-md bg-[#e6dcc4]" />
            <Leaf
              side="right"
              page={pages[rightIndex]}
              hasBack={rightIndex > 0}
              hasNext={rightIndex < pages.length - 1}
              font={font}
              onTap={(side) => go(side)}
              onBack={canBack ? () => go(-1) : undefined}
              onNext={canNext ? () => go(1) : undefined}
              onClose={onClose}
            />
            {/* the leaf turning: over the right leaf, hinged on the spine */}
            {turn && leafIndex !== null && (
              <div
                className="pointer-events-none absolute inset-0"
                onAnimationEnd={finishTurn}
                style={{
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  animation: `diary-turn-${turn.dir === 1 ? 'fwd' : 'back'} ${TURN_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1) forwards`,
                }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                  <Leaf
                    side="right"
                    page={pages[leafIndex]}
                    hasBack={leafIndex > 0}
                    hasNext={leafIndex < pages.length - 1}
                    font={font}
                  />
                  {/* the tab glued to this page, turning with it */}
                  {leafTab && (
                    <div className="pointer-events-none absolute inset-y-0 left-full w-0">
                      {/* a tab in flight stays as it was: lit, because it is the top
                          page's — leaving with it, or arriving with it */}
                      <Tab id={leafTab.id} top={slotTop(leafTab)} active />
                    </div>
                  )}
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <Leaf side="left" page={null} font={font} />
                </div>
              </div>
            )}
          </div>
          {/* the index tabs, out of the right edge: paper, a little
              stiffer than the pages, each with its section's mark drawn on
              it in pencil; the current section's stands proud */}
          <div className="pointer-events-none absolute inset-y-0 left-full z-10 w-0">
            {stackTabs.map((tab) => (
              <Tab
                key={tab.id}
                id={tab.id}
                top={slotTop(tab)}
                // the tab standing proud is the top page's: going forward that is
                // the destination from the moment the leaf lifts; going back it is
                // still the page being covered, until the leaf lands on it
                active={tab.first === (turn ? (turn.dir === 1 ? turn.to : turn.from) : index)}
                onClick={() => jumpTo(tab.first)}
              />
            ))}
          </div>
          {/* the spine's shadow, over both leaves */}
          <span
            className="pointer-events-none absolute inset-y-0 left-1/2 w-16 -translate-x-1/2"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * One leaf: cream paper, faint rules, a margin line, the running head. A
 * right leaf also carries the controls, drawn on the paper in the same
 * pencil as the sketches: the cross in the top corner, the arrows in the
 * bottom corners — an arrow only where there is a page that way. They are
 * part of the drawing on every right face (the turning sheet's included),
 * and buttons only on the leaf you are on, so a page landing never gains
 * or loses a mark.
 */
function Leaf({
  side,
  page,
  font,
  hasBack = false,
  hasNext = false,
  onTap,
  onBack,
  onNext,
  onClose,
}: {
  side: 'left' | 'right'
  page: DiaryPage | null
  font: string
  hasBack?: boolean
  hasNext?: boolean
  onTap?: (side: 1 | -1) => void
  onBack?: () => void
  onNext?: () => void
  onClose?: () => void
}) {
  const right = side === 'right'
  const live = Boolean(onTap)
  return (
    <div
      className={`relative h-[34rem] overflow-hidden text-[#3d3830] ${right ? 'rounded-r-md' : 'rounded-l-md'}`}
      style={{
        fontFamily: font,
        // The rules, every 26px from the top of the leaf, phased so one falls
        // 4px under each baseline: the head takes 12 + 16.5 + 4 px and the
        // first line's baseline sits 19px into its 26, which is 3.5px into
        // a period. The phase is in the gradient itself, not a background
        // position — a shifted tile leaves the top of the leaf without its
        // rules. Every block on a page is a whole number of lines tall, so
        // the text stays in step all the way down.
        //
        // The book is shown at 12/13 (see DiaryModal), which makes a line
        // 24px; the rule is 13/12 px wide from 3.79px so that, scaled, it
        // is one whole pixel from 3.5 — a thinner rule at an odd offset
        // fell between pixels and some rules went missing.
        background:
          'repeating-linear-gradient(180deg, transparent 0 3.7917px, rgba(61,56,48,0.10) 3.7917px 4.875px, transparent 4.875px 26px), #efe6d2',
        boxShadow: 'inset 0 0 0 1px rgba(61,56,48,0.12)',
      }}
      onClick={
        onTap
          ? (e) => {
              const box = e.currentTarget.getBoundingClientRect()
              onTap(e.clientX - box.left > box.width / 2 ? 1 : -1)
            }
          : undefined
      }
    >
      {/* the margin line */}
      <span
        className={`pointer-events-none absolute bottom-0 top-0 w-px bg-[#c9605a]/45 ${right ? 'left-9' : 'right-9'}`}
      />
      {page && (
        <div className={`flex h-full flex-col pb-14 pt-3 ${right ? 'pl-12 pr-6' : 'pl-6 pr-12'}`}>
          <p
            className="pr-8 text-[11px] uppercase tracking-[0.22em] text-[#8a8070]"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            {page.head}
          </p>
          <div className="mt-1 min-h-0 flex-1 overflow-hidden text-[15px] leading-[26px]">{page.content}</div>
        </div>
      )}
      {right && (
        <>
          {/* the cross: drawn in the head's grey, small, in the corner,
              centred between the first two rules */}
          <button
            onClick={
              live
                ? (e) => {
                    e.stopPropagation()
                    onClose?.()
                  }
                : undefined
            }
            tabIndex={live ? 0 : -1}
            aria-label="Close"
            aria-hidden={!live}
            className={`absolute right-4 top-[7px] h-5 w-5 ${live ? '' : 'pointer-events-none'}`}
          >
            <svg viewBox="0 0 20 20" className="h-full w-full" style={{ filter: 'url(#pencil)' }} aria-hidden="true">
              <path d="M5 5 L15 15 M15 5 L5 15" fill="none" stroke={FAINT} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {/* the arrows: the plain silhouette, one line, in the corners */}
          {hasBack && (
            <button
              onClick={
                live
                  ? (e) => {
                      e.stopPropagation()
                      onBack?.()
                    }
                  : undefined
              }
              tabIndex={live ? 0 : -1}
              aria-label="‹"
              aria-hidden={!live}
              className={`absolute bottom-3 left-12 h-7 w-9 ${live ? '' : 'pointer-events-none'}`}
            >
              <ArrowSketch dir={-1} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={
                live
                  ? (e) => {
                      e.stopPropagation()
                      onNext?.()
                    }
                  : undefined
              }
              tabIndex={live ? 0 : -1}
              aria-label="›"
              aria-hidden={!live}
              className={`absolute bottom-3 right-4 h-7 w-9 ${live ? '' : 'pointer-events-none'}`}
            >
              <ArrowSketch dir={1} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

/** One index tab: paper a little stiffer than the pages, its section's
 *  mark drawn on it; the current section's stands proud. Sits at a fixed
 *  slot down the edge, wherever it is rendered — on the stack or on a
 *  turning leaf — so it never shifts. */
function Tab({
  id,
  top,
  active,
  onClick,
}: {
  id: DiaryPage['tab']
  top: number
  active: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-label={id}
      aria-hidden={!onClick}
      className={`absolute -left-[2px] flex h-[3.75rem] items-center justify-center rounded-r-lg border border-l-0 ${
        onClick ? 'pointer-events-auto' : ''
      } ${active ? 'w-[28px] border-[#c9b8a0] bg-[#f3ebd8]' : 'w-[25px] border-[#c9b8a0]/70 bg-[#e3d9c1]'}`}
      style={{ top, boxShadow: '1px 1px 2px rgba(0,0,0,0.35)' }}
    >
      <TabMark id={id} faint={!active} />
    </button>
  )
}

/** The mark on each tab, drawn in the same pencil as the rest: a pen for
 *  the report, a wrench for the manual, a compass for the route. */
function TabMark({ id, faint }: { id: DiaryPage['tab']; faint: boolean }) {
  const stroke = faint ? FAINT : INK
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" style={{ filter: 'url(#pencil-soft)' }} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {id === 'report' && (
          <>
            {/* a pen, nib down */}
            <path d="M13.5 2.5 L17.5 6.5 L8 16 L3.5 17 L4.5 12.5 Z" />
            <path d="M11.5 4.5 L15.5 8.5" />
            <path d="M4.5 12.5 L8 16" />
          </>
        )}
        {id === 'manual' && (
          <>
            {/* a wrench */}
            <path d="M12.5 2.8 a4.2 4.2 0 0 0 -4.6 5.6 L3 13.3 a1.6 1.6 0 0 0 2.3 2.3 L10.2 10.7 a4.2 4.2 0 0 0 5.6 -4.6 L13.3 8.6 L11 6.3 Z" />
          </>
        )}
        {id === 'route' && (
          <>
            {/* a compass rose */}
            <circle cx="10" cy="10" r="7" />
            <path d="M10 3 V5 M10 15 V17 M3 10 H5 M15 10 H17" />
            <path d="M13 7 L11 11 L7 13 L9 9 Z" />
          </>
        )}
      </g>
    </svg>
  )
}

/** An arrow the way it gets drawn in a margin: the outline of one, a
 *  shaft and a head, in a single pencil line. */
function ArrowSketch({ dir }: { dir: 1 | -1 }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className="h-full w-full"
      style={{ filter: 'url(#pencil)', transform: dir === -1 ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M3 9.5 H21 V4 L33 12 L21 20 V14.5 H3 Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
