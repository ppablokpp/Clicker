import { Diamond } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#08080c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400 border-r-fuchsia-400"
          style={{ animationDuration: '0.8s' }}
        />
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-200">
          <Diamond size={18} />
        </div>
      </div>
    </div>
  )
}
