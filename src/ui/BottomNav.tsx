export type Tab = 'menu' | 'compra' | 'recetas'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'menu', label: 'Menú', icon: '📅' },
  { id: 'compra', label: 'Compra', icon: '🛒' },
  { id: 'recetas', label: 'Recetas', icon: '📖' },
]

export function BottomNav({ current, onChange }: { current: string; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-borde bg-white pb-safe" aria-label="Secciones">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = current === t.id
          return (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => onChange(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-18 w-full flex-col items-center justify-center gap-0.5 text-base font-bold ${
                  active ? 'text-terra' : 'text-gris'
                }`}
              >
                <span className={`text-2xl leading-none ${active ? '' : 'opacity-70'}`} aria-hidden>
                  {t.icon}
                </span>
                {t.label}
                <span className={`mt-1 h-1 w-10 rounded-full ${active ? 'bg-terra' : 'bg-transparent'}`} />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
