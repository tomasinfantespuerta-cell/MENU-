import { useEffect, useState } from 'react'
import { MenuPage } from './features/menu/MenuPage'
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

type Route = Tab | 'ajustes'
const ROUTES: Route[] = ['menu', 'compra', 'recetas', 'ajustes']
const TITLES: Record<Route, string> = {
  menu: 'Menú semanal',
  compra: 'La compra',
  recetas: 'Recetas',
  ajustes: 'Ajustes',
}

function readRoute(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route
  return ROUTES.includes(r) ? r : 'compra'
}

function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute)
  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return [route, (r) => (location.hash = `/${r}`)]
}

function Shell({ onLeave }: { onLeave: () => void }) {
  const engine = useEngine()
  const [route, go] = useHashRoute()

  useEffect(() => {
    document.title = `${TITLES[route]} · Comidas de casa`
    window.scrollTo(0, 0)
  }, [route])

  const leave = async () => {
    engine.dispose()
    engine.db.close()
    await engine.db.delete().catch(() => {})
    onLeave()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-borde bg-crema/95 px-4 pt-safe backdrop-blur">
        <div className="flex min-h-16 items-center gap-2">
          {route === 'ajustes' ? (
            <button onClick={() => history.back()} className="-ml-2 min-h-12 rounded-xl px-2 text-lg font-semibold text-terra">
              ‹ Volver
            </button>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold">{TITLES[route]}</h1>
          )}
          {route === 'ajustes' && <h1 className="flex-1 truncate text-center text-xl font-bold">Ajustes</h1>}
          <SyncBadge />
          {route !== 'ajustes' && (
            <button onClick={() => go('ajustes')} aria-label="Ajustes" className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
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
        {route === 'compra' && <ShoppingPage />}
        {route === 'menu' && <MenuPage />}
        {route === 'recetas' && <RecipesPage />}
        {route === 'ajustes' && <SettingsPage onLeave={leave} />}
      </main>

      <BottomNav current={route} onChange={go} />
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
