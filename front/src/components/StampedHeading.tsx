interface StampedHeadingProps {
  children: React.ReactNode
  /** Gradient class for the left hairline (transparent → colour). */
  ruleFrom: string
  /** Gradient class for the right hairline (colour ← transparent). */
  ruleTo: string
  /** Text colour class for the title itself. */
  tone: string
  /** Wrapper classes — the caller owns the margin, since what follows a
      heading here varies: a status line, a rack of chests, a list of lots. */
  className?: string
}

/**
 * Stamped, not written: wide-tracked caps between two hairlines, which is what
 * a heading looks like when it has been struck into a plate rather than printed
 * on a page. Every section of the store wears it — the page title, the chest
 * bench, the boost racks, the shop manifests — so the form is what makes them
 * read as one place and the colour is what keeps them apart.
 *
 * The rules are fixed at 40px rather than flexing to the edges: short ones read
 * as a stamp, a full-width one reads as a divider with a word dropped in the
 * middle of it.
 *
 * Tracking tightens on narrow screens. At 0.32em a long title (MULTIPLICADORES,
 * or a material name after "Comprar") is wider than a phone, and nowrap means it
 * would push the rules off the page rather than wrap.
 *
 * indent compensates the tracking, and has to track it step for step. Letter-
 * spacing is applied AFTER the last character too, so a centred word sits half a
 * space left of true centre — visible at 0.32em, and the reason wide-tracked
 * headings so often look subtly off.
 */
export function StampedHeading({ children, ruleFrom, ruleTo, tone, className = '' }: StampedHeadingProps) {
  return (
    <div className={`relative flex items-center justify-center gap-3.5 ${className}`}>
      <span className={`h-px w-10 shrink-0 ${ruleFrom}`} />
      <p
        className={`indent-[0.2em] whitespace-nowrap text-lg font-semibold uppercase tracking-[0.2em] sm:indent-[0.32em] sm:tracking-[0.32em] ${tone}`}
      >
        {children}
      </p>
      <span className={`h-px w-10 shrink-0 ${ruleTo}`} />
    </div>
  )
}
