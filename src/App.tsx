import { useEffect, useState } from 'react'
import { MenuPage } from './features/menu/MenuPage'
import { useSeedRecipes } from './features/recipes/hooks'
import { RecipeDetail } from './features/recipes/RecipeDetail'
import { RecipeEditor } from './features/recipes/RecipeEditor'
import { RecipesPage } from './features/recipes/RecipesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { ShoppingPage } from './features/shopping/ShoppingPage'
import { clearHousehold, loadHousehold, saveHousehold, type Household } from './household/session'
import { WelcomePage } from './household/WelcomePage'
import { DEMO_MODE, SUPABASE_CONFIGURED } from './lib/supabase'
import { EngineProvider, useEngine } from './sync/EngineProvider'
import { BottomNav, type Tab } from './ui/BottomNav'
import { FeedbackProvider } from './ui/feedback'
import { SyncBadge } from './ui/SyncBadge'

const TABS: Tab[] = ['menu', 'compra', 'recetas']
const TAB_TITLES: Record<Tab, string> = {
  menu: 'Menú semanal',
  compra: 'La compra',
  recetas: 'Recetas',
}
const LAST_TAB_KEY = 'comidas-casa.ultima-pestana'

interface Route {
  path: string
  tab: Tab | null
  /** Pantallas "hijas" con botón Volver. */
  page: 'lista' | 'ajustes' | 'receta' | 'editar-receta' | 'nueva-receta'
  id: string | null
}

function lastTab(): Tab {
  try {
    const t = localStorage.getItem(LAST_TAB_KEY) as Tab | null
    return t && TABS.includes(t) ? t : 'menu'
  } catch {
    return 'menu'
  }
}

function parseRoute(): Route {
  const path = location.hash.replace(/^#\/?/, '')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'ajustes') return { path, tab: null, page: 'ajustes', id: null }
  if (parts[0] === 'recetas' && parts[1] === 'nueva') return { path, tab: 'recetas', page: 'nueva-receta', id: null }
  if (parts[0] === 'recetas' && parts[1] && parts[2] === 'editar') return { path, tab: 'recetas', page: 'editar-receta', id: parts[1] }
  if (parts[0] === 'recetas' && parts[1]) return { path, tab: 'recetas', page: 'receta', id: parts[1] }
  const tab = TABS.includes(parts[0] as Tab) ? (parts[0] as Tab) : lastTab()
  return { path: tab, tab, page: 'lista', id: null }
}

function useHashRoute(): [Route, (path: string) => void] {
  const [route, setRoute] = useState<Route>(parseRoute)
  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return [route, (path) => (location.hash = `/${path}`)]
}

function titleOf(route: Route): string {
  switch (route.page) {
    case 'ajustes':
      return 'Ajustes'
    case 'receta':
      return 'Receta'
    case 'editar-receta':
      return 'Editar receta'
    case 'nueva-receta':
      return 'Nueva receta'
    default:
      return TAB_TITLES[route.tab ?? 'menu']
  }
}

function parentOf(route: Route): string | null {
  switch (route.page) {
    case 'ajustes':
      return lastTab()
    case 'receta':
    case 'nueva-receta':
      return 'recetas'
    case 'editar-receta':
      return `recetas/${route.id}`
    default:
      return null
  }
}

function Shell({ onLeave }: { onLeave: () => void }) {
  const engine = useEngine()
  const [route, go] = useHashRoute()
  useSeedRecipes()

  useEffect(() => {
    document.title = `${titleOf(route)} · Comidas de casa`
    window.scrollTo(0, 0)
    if (route.page === 'lista' && route.tab) {
      try {
        localStorage.setItem(LAST_TAB_KEY, route.tab)
      } catch {
        /* sin almacenamiento */
      }
    }
  }, [route.path, route.page, route.tab])

  const leave = async () => {
    engine.dispose()
    engine.db.close()
    await engine.db.delete().catch(() => {})
    onLeave()
  }

  const parent = parentOf(route)

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-borde bg-crema/95 px-4 pt-safe backdrop-blur">
        <div className="flex min-h-16 items-center gap-2">
          {parent ? (
            <>
              <button onClick={() => go(parent)} className="-ml-2 min-h-12 shrink-0 rounded-xl px-2 text-lg font-semibold text-terra">
                ‹ Volver
              </button>
              <h1 className="min-w-0 flex-1 truncate text-center text-lg font-bold">{titleOf(route)}</h1>
            </>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold">{titleOf(route)}</h1>
          )}
          <SyncBadge />
          {route.page !== 'ajustes' && (
            <button onClick={() => go('ajustes')} aria-label="Ajustes" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl">
              ⚙️
            </button>
          )}
        </div>
        {DEMO_MODE && (
          <p className="-mx-4 bg-aviso-claro px-4 py-1 text-center text-sm font-semibold text-aviso">
            Modo prueba: los datos solo se guardan en este dispositivo
          </p>
        )}
      </header>

      <main className="flex-1 px-4 pt-4 pb-32">
        {route.page === 'lista' && route.tab === 'compra' && <ShoppingPage />}
        {route.page === 'lista' && route.tab === 'menu' && <MenuPage go={go} />}
        {route.page === 'lista' && route.tab === 'recetas' && <RecipesPage go={go} />}
        {route.page === 'receta' && route.id && <RecipeDetail id={route.id} go={go} />}
        {route.page === 'editar-receta' && route.id && <RecipeEditor id={route.id} go={go} />}
        {route.page === 'nueva-receta' && <RecipeEditor id={null} go={go} />}
        {route.page === 'ajustes' && <SettingsPage onLeave={leave} />}
      </main>

      <BottomNav current={route.tab ?? ''} onChange={(t) => go(t)} />
    </div>
  )
}

function ConfigMissing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Falta configurar Supabase</h1>
      <p className="text-lg text-gris">
        Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en las variables de entorno (ver
        docs/DESPLIEGUE.md) y vuelve a desplegar.
      </p>
    </main>
  )
}

export default function App() {
  const [household, setHousehold] = useState<Household | null>(loadHousehold)

  if (!SUPABASE_CONFIGURED && !DEMO_MODE) return <ConfigMissing />

  return (
    <FeedbackProvider>
      {household ? (
        <EngineProvider key={household.id} household={household}>
          <Shell
            onLeave={() => {
              clearHousehold()
              setHousehold(null)
            }}
          />
        </EngineProvider>
      ) : (
        <WelcomePage
          onReady={(h) => {
            saveHousehold(h)
            setHousehold(h)
          }}
        />
      )}
    </FeedbackProvider>
  )
}
