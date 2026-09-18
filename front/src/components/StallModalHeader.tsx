import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * A stall card, the way the store's stalls (the key and gem shops) open:
 * the bulkhead behind (a pool of lamp light, a plate grid), a lamp hanging
 * into frame, the name stamped in caps between two rules, and a mono line
 * under it — all lit in one accent. Home's header sheets (the command
 * centre, the inventory, the tasks, the log) wear it too, so a sheet
 * opened from the cockpit reads as the same kind of place as one opened
 * from the store.
 *
 * Two pieces, because they belong to different layers. `StallModalWall`
 * is the bulkhead and the close button: it goes straight in the card, and
 * stays put. `StallModalHeader` is the lamp and the name: it goes at the
 * top of the card's scrolling body, and scrolls away with it.
 */

interface Accent {
  /** The fill for the rules and the text glow, the glow for the lamp's pool. */
  fill: string
  glow: string
}

export function StallModalWall({ accent, onClose }: { accent: Accent; onClose: () => void }) {
  return (
    <>
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(58% 34% at 50% -2%, ${accent.fill}33, transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 68px)`,
        }}
      />
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-20 text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <X size={16} />
      </button>
    </>
  )
}

export function StallModalHeader({
  title,
  subtitle,
  accent,
  size = 'md',
}: {
  title: ReactNode
  subtitle?: ReactNode
  accent: Accent
  /** A long name takes the smaller size, so it stays on one line. */
  size?: 'md' | 'sm'
}) {
  return (
    <div className="relative">
      <div
        className="relative mx-auto h-4 w-16 rounded-b-lg bg-gradient-to-b from-[#6D7480] to-[#2C3037]"
        style={{ boxShadow: `0 10px 26px ${accent.glow}` }}
      />
      <div className="relative mt-5 flex flex-col items-center px-6">
        <p
          className={`border-y-2 px-7 py-1 text-center font-extrabold uppercase tracking-wider text-[#F7F3EA] ${size === 'sm' ? 'text-xl' : 'text-2xl'}`}
          style={{ borderColor: `${accent.fill}80`, textShadow: `0 2px 0 rgba(0,0,0,.5), 0 0 26px ${accent.fill}59` }}
        >
          {title}
        </p>
        {subtitle && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: `${accent.fill}a6` }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
