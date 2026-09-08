import { Gem } from 'lucide-react'

/**
 * The gem balance, pinned top-right, styled exactly like the store's own
 * header pill so the same number never looks like two different things in two
 * places. Tapping it opens the gem packs, because the screens that show gem
 * prices are exactly the screens where you find out you're short.
 *
 * Fixed rather than in flow: it sits opposite the back arrow on both the
 * locker and a piece's detail page, and both of those scroll underneath it.
 */
export function GemsPill({
  gems,
  locale,
  label,
  onClick,
}: {
  gems: number
  locale: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed right-4 top-4 z-40 flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3 py-1.5 text-xs font-semibold tabular-nums text-indigo-200 shadow-lg shadow-black/20 transition-colors hover:bg-indigo-500/[0.14] sm:right-6 sm:top-6"
    >
      <Gem size={12} className="opacity-80" />
      {gems.toLocaleString(locale)}
    </button>
  )
}
