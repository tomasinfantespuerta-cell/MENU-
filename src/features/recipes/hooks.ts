import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { useEngine, useHousehold } from '../../sync/EngineProvider'
import type { MenuDay } from '../menu/logic'
import { planSeed, type Recipe } from './logic'
import { SEED_RECIPES } from './seed'
import { HEALTHY_SEED_RECIPES } from './seedHealthy'

export function useRecipes(): Recipe[] | undefined {
  const engine = useEngine()
  return useLiveQuery(() => engine.db.rows('recipes').toArray() as unknown as Promise<Recipe[]>, [engine])
}

export function useRecipe(id: string | null): Recipe | undefined | null {
  const engine = useEngine()
  return useLiveQuery(
    async () => (id ? (((await engine.db.rows('recipes').get(id)) as unknown as Recipe) ?? null) : null),
    [engine, id],
  )
}

export function useMenuDays(): MenuDay[] | undefined {
  const engine = useEngine()
  return useLiveQuery(() => engine.db.rows('menu_days').toArray() as unknown as Promise<MenuDay[]>, [engine])
}

// v2: añade las recetas saludables. Solo crea las que falten (nunca las borradas).
const SEED_FLAG = 'seed:v2'

/**
 * Carga las recetas iniciales una vez, cuando la copia local ya está completa.
 * Los ids son fijos, así que aunque los dos móviles lo hagan a la vez no se duplican.
 */
export function useSeedRecipes() {
  const engine = useEngine()
  const household = useHousehold()
  useEffect(() => {
    let running = false
    const trySeed = async () => {
      if (running) return
      running = true
      try {
        if (await engine.db.getMeta(SEED_FLAG)) return
        if (!(await engine.hasPulledOnce())) return
        const ids = new Set((await engine.db.rows('recipes').toArray()).map((r) => r.id))
        const muts = await planSeed([...SEED_RECIPES, ...HEALTHY_SEED_RECIPES], ids, household.id)
        if (muts.length) await engine.mutate(muts)
        await engine.db.setMeta(SEED_FLAG, new Date().toISOString())
      } finally {
        running = false
      }
    }
    void trySeed()
    return engine.subscribe(() => void trySeed())
  }, [engine, household.id])
}
