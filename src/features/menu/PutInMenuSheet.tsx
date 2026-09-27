import { useMemo } from 'react'
import { addDays, formatShortDate, formatWeekRange, mondayOf, today, weekDates, weekdayName } from '../../lib/dates'
import { useEngine } from '../../sync/EngineProvider'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import type { Recipe } from '../recipes/logic'
import { useMenuDays, useRecipes } from '../recipes/hooks'
import { dishLabel, planSetDay, type MenuDay } from './logic'

/** Elegir el día en que se pone una receta (esta semana y la siguiente). */
export function PutInMenuSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const engine = useEngine()
  const { showUndo } = useFeedback()
  const days = useMenuDays()
  const recipes = useRecipes()
  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.id, d])), [days])
  const recipeMap = useMemo(() => new Map((recipes ?? []).map((r) => [r.id, r])), [recipes])
  const thisMonday = mondayOf(today())
  const weeks = [thisMonday, addDays(thisMonday, 7)]

  const choose = async (date: string) => {
    const prev: MenuDay | undefined = byDate.get(date)
    await engine.mutate([planSetDay(date, { dish_text: recipe.title, recipe_id: recipe.id })])
    onClose()
    showUndo(`Puesto el ${weekdayName(date).toLowerCase()} ${formatShortDate(date)}`, () =>
      engine.mutate([planSetDay(date, prev && !prev.deleted_at ? { dish_text: prev.dish_text, recipe_id: prev.recipe_id } : null)]),
    )
  }

  return (
    <Sheet title="¿Qué día?" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {weeks.map((monday, wi) => (
          <section key={monday}>
            <h3 className="mb-2 text-base font-bold text-gris">
              {wi === 0 ? 'Esta semana' : 'Semana que viene'} · {formatWeekRange(monday)}
            </h3>
            <ul className="flex flex-col gap-2">
              {weekDates(monday)
                .filter((d) => d >= today())
                .map((date) => {
                  const current = dishLabel(byDate.get(date), recipeMap)
                  return (
                    <li key={date}>
                      <button
                        onClick={() => void choose(date)}
                        className="flex min-h-16 w-full flex-col justify-center rounded-2xl border-2 border-borde bg-white px-4 py-2 text-left active:bg-terra-claro"
                      >
                        <span className="text-lg font-bold">
                          {weekdayName(date)} <span className="font-normal text-gris">{formatShortDate(date)}</span>
                        </span>
                        <span className="text-base text-gris">{current ? `Ahora: ${current}` : 'Libre'}</span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
