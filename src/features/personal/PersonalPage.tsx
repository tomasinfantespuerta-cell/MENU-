import { useState } from 'react'
import { MenuPage } from '../menu/MenuPage'
import { ShoppingPage } from '../shopping/ShoppingPage'

type Section = 'menu' | 'compra'
const KEY = 'comidas-casa.yo.seccion'

function readSection(): Section {
  try {
    return localStorage.getItem(KEY) === 'compra' ? 'compra' : 'menu'
  } catch {
    return 'menu'
  }
}

/** Pestaña «Yo»: menú y lista de la compra personales. */
export function PersonalPage({ go }: { go: (path: string) => void }) {
  const [section, setSection] = useState<Section>(readSection)
  const choose = (s: Section) => {
    setSection(s)
    try {
      localStorage.setItem(KEY, s)
    } catch {
      /* sin almacenamiento */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-crema-oscuro p-1" role="tablist">
        {(
          [
            ['menu', '📅 Mi menú'],
            ['compra', '🛒 Mi compra'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={section === id}
            onClick={() => choose(id)}
            className={`min-h-12 rounded-xl text-lg font-bold ${section === id ? 'bg-white text-terra shadow-sm' : 'text-gris'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'menu' ? (
        <>
          <button
            onClick={() => go('yo/ideas')}
            className="flex min-h-14 items-center justify-between rounded-2xl border-2 border-terra bg-terra-claro px-4 text-left text-lg font-bold text-terra-oscuro"
          >
            <span>✨ Ideas saludables de la semana</span>
            <span aria-hidden>›</span>
          </button>
          <MenuPage go={go} scope="yo" />
        </>
      ) : (
        <ShoppingPage list="yo" />
      )}
    </div>
  )
}
