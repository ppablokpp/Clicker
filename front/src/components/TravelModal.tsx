import { Rocket, X } from 'lucide-react'

// The "do you want to fly there?" sheet, used both ways: Home asks before
// the station, the station asks before the rock. Same cockpit card as the
// game's other confirms, with one accent — violet, the ship's own.
export function TravelModal({
  title,
  body,
  confirm,
  cancel,
  onConfirm,
  onClose,
}: {
  title: string
  body: string
  confirm: string
  cancel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#15151d] via-[#0e0e15] to-[#0a0a10] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-white/5 px-6 pb-5 pt-6">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)' }}
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300"
          >
            <X size={16} />
          </button>
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-200">
              <Rocket size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-neutral-400">{body}</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/[0.08]"
            >
              {cancel}
            </button>
            <button
              data-tutorial="travel-go"
              onClick={onConfirm}
              className="flex-1 rounded-xl border border-violet-400/40 bg-violet-500/20 px-4 py-3 text-sm font-bold text-violet-100 shadow-lg shadow-violet-500/10 transition-colors hover:bg-violet-500/30"
            >
              {confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
