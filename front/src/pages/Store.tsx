import { Sparkles, Zap, Palette, MousePointerClick } from 'lucide-react'

const UPCOMING = [
  { icon: Zap, title: 'Multiplicadores', desc: 'Aumenta los clicks que suma cada toque.' },
  { icon: Palette, title: 'Temas y skins', desc: 'Personaliza colores y efectos de la zona de click.' },
  { icon: MousePointerClick, title: 'Auto-clicker', desc: 'Genera clicks pasivamente con mejoras.' },
]

export function Store() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#08080c] px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-white sm:text-3xl">Tienda</h1>
          <p className="mt-1 text-sm text-neutral-500">Todavía no hay nada a la venta, pero esto es lo que viene.</p>
        </header>

        <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-14 text-center">
          <Sparkles size={28} className="text-violet-400/70" />
          <p className="text-sm font-medium text-neutral-400">Próximamente</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {UPCOMING.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-4 opacity-70"
            >
              <Icon size={18} className="mb-2 text-violet-300" />
              <p className="text-sm font-semibold text-neutral-200">{title}</p>
              <p className="mt-1 text-xs text-neutral-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
