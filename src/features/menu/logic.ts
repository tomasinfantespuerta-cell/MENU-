import { addDays, weekDates } from '../../lib/dates'
import type { Mutation } from '../../sync/types'

export interface MenuDay {
  /** 'AAAA-MM-DD' */
  id: string
  household_id: string
  dish_text: string | null
  recipe_id: string | null
  deleted_at?: string | null
  updated_at?: string | null
}

export interface RecipeRef {
  id: string
  title: string
  deleted_at?: string | null
}

/** Texto a mostrar: el título actual de la receta si está enlazada, si no lo escrito a mano. */
export function dishLabel(day: MenuDay | undefined, recipes: Map<string, RecipeRef>): string | null {
  if (!day || day.deleted_at) return null
  if (day.recipe_id) {
    const r = recipes.get(day.recipe_id)
    if (r && !r.deleted_at) return r.title
  }
  const t = day.dish_text?.trim()
  return t ? t : null
}

export function hasDish(day: MenuDay | undefined): boolean {
  return Boolean(day && !day.deleted_at && (day.dish_text?.trim() || day.recipe_id))
}

/** Cambio para poner (o quitar, con null) el plato de un día. Idempotente: el id es la fecha. */
export function planSetDay(date: string, dish: { dish_text: string | null; recipe_id: string | null } | null): Mutation {
  return {
    table: 'menu_days',
    id: date,
    op: 'insert',
    patch: {
      dish_text: dish?.dish_text?.trim() || null,
      recipe_id: dish?.recipe_id ?? null,
      deleted_at: null,
    },
  }
}

/**
 * Copia los 7 días de una semana sobre otra. Los días vacíos de origen dejan
 * vacío el destino, así la semana queda exactamente igual que la copiada.
 */
export function planCopyWeek(fromMonday: string, toMonday: string, byDate: Map<string, MenuDay>): Mutation[] {
  return weekDates(fromMonday).map((src, i) => {
    const d = byDate.get(src)
    const target = addDays(toMonday, i)
    return hasDish(d) ? planSetDay(target, { dish_text: d!.dish_text, recipe_id: d!.recipe_id }) : planSetDay(target, null)
  })
}

/** Semanas anteriores a `beforeMonday` que tienen algún plato, de la más reciente a la más antigua. */
export function pastWeeksWithDishes(days: MenuDay[], beforeMonday: string, mondayOf: (iso: string) => string): Array<{ monday: string; count: number }> {
  const counts = new Map<string, number>()
  for (const d of days) {
    if (!hasDish(d)) continue
    const m = mondayOf(d.id)
    if (m >= beforeMonday) continue
    counts.set(m, (counts.get(m) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([monday, count]) => ({ monday, count }))
}
