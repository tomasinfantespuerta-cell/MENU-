import { useState } from 'react'
import { useEngine, useHousehold } from '../../sync/EngineProvider'
import { useFeedback } from '../../ui/feedback'
import { PutInMenuSheet } from '../menu/PutInMenuSheet'
import { useShoppingItems } from '../shopping/hooks'
import { planAddMany } from '../shopping/logic'
import { difficultyLabel, formatMinutes, ingredientsForShopping } from './logic'
import { useRecipe } from './hooks'
import { RecipeImage } from './RecipeImage'

export function RecipeDetail({ id, go }: { id: string; go: (path: string) => void }) {
  const engine = useEngine()
  const household = useHousehold()
  const { showUndo, showInfo, confirm } = useFeedback()
  const recipe = useRecipe(id)
  const shopping = useShoppingItems()
  const [choosingDay, setChoosingDay] = useState(false)

  if (recipe === undefined) return <p className="p-6 text-center text-lg text-gris">Cargando…</p>
  if (recipe === null || recipe.deleted_at) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-lg text-gris">Esta receta ya no existe.</p>
        <button onClick={() => go('recetas')} className="min-h-14 rounded-2xl bg-terra px-6 text-lg font-bold text-white">
          Ver recetas
        </button>
      </div>
    )
  }

  const addToList = async () => {
    const plan = planAddMany(ingredientsForShopping(recipe), shopping ?? [], household.id)
    if (plan.mutations.length === 0) {
      showInfo('Todo ya estaba en la lista de la compra ✓')
      return
    }
    await engine.mutate(plan.mutations)
    const n = plan.added.length + plan.reactivated.length
    const extra = plan.skipped.length ? ` (${plan.skipped.length} ya estaban)` : ''
    const undoMuts = [
      ...plan.mutations
        .filter((m) => m.op === 'insert')
        .map((m) => ({ ...m, op: 'update' as const, patch: { deleted_at: new Date().toISOString() } })),
      ...plan.mutations
        .filter((m) => m.op === 'update')
        .map((m) => ({ ...m, patch: { checked: true, checked_at: new Date().toISOString() } })),
    ]
    showUndo(`${n} ${n === 1 ? 'producto añadido' : 'productos añadidos'} a la compra${extra}`, () => engine.mutate(undoMuts))
  }

  const remove = async () => {
    const ok = await confirm({
      title: `¿Borrar «${recipe.title}»?`,
      message: 'Desaparecerá del recetario de los dos móviles.',
      confirmLabel: 'Sí, borrar',
      danger: true,
    })
    if (!ok) return
    await engine.remove('recipes', recipe.id)
    go('recetas')
    showUndo('Receta borrada', () => engine.restore('recipes', recipe.id))
  }

  const meta = [
    formatMinutes(recipe.prep_minutes) && `⏱ ${formatMinutes(recipe.prep_minutes)}`,
    difficultyLabel(recipe.difficulty) && `👩‍🍳 ${difficultyLabel(recipe.difficulty)}`,
    recipe.servings && `🍽 ${recipe.servings} ${recipe.servings === 1 ? 'ración' : 'raciones'}`,
  ].filter(Boolean) as string[]

  return (
    <article className="flex flex-col gap-5">
      {recipe.photo_path && <RecipeImage recipe={recipe} className="aspect-[4/3] w-full rounded-3xl" />}
      <div>
        <h2 className="text-2xl leading-tight font-extrabold">{recipe.title}</h2>
        {meta.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {meta.map((m) => (
              <li key={m} className="rounded-full bg-crema-oscuro px-3 py-1 text-base font-semibold">{m}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => void addToList()} className="min-h-16 rounded-2xl bg-terra px-4 text-lg font-bold text-white active:scale-[0.98]">
          🛒 Añadir ingredientes a la compra
        </button>
        <button onClick={() => setChoosingDay(true)} className="min-h-16 rounded-2xl bg-oliva px-4 text-lg font-bold text-white active:scale-[0.98]">
          📅 Poner en el menú
        </button>
      </div>

      {recipe.ingredients?.length > 0 && (
        <section className="rounded-3xl border-2 border-borde bg-white p-5">
          <h3 className="mb-3 text-xl font-bold">Ingredientes</h3>
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex gap-3 text-lg leading-snug">
                <span aria-hidden className="text-terra">•</span>
                <span>
                  <strong className="font-semibold">{ing.name}</strong>
                  {ing.quantity && <span className="text-gris"> — {ing.quantity}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps?.length > 0 && (
        <section className="rounded-3xl border-2 border-borde bg-white p-5">
          <h3 className="mb-3 text-xl font-bold">Preparación</h3>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-lg leading-snug">
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terra text-base font-bold text-white">
                  {idx + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {recipe.notes && (
        <section className="rounded-3xl bg-aviso-claro p-5 text-lg">
          <h3 className="mb-1 font-bold">Notas</h3>
          <p className="whitespace-pre-line">{recipe.notes}</p>
        </section>
      )}

      <div className="flex gap-3">
        <button onClick={() => go(`recetas/${recipe.id}/editar`)} className="min-h-14 flex-1 rounded-2xl border-2 border-borde bg-white text-lg font-semibold">
          ✏️ Editar
        </button>
        <button onClick={() => void remove()} className="min-h-14 flex-1 rounded-2xl border-2 border-terra bg-white text-lg font-semibold text-terra">
          🗑️ Borrar
        </button>
      </div>

      {choosingDay && <PutInMenuSheet recipe={recipe} onClose={() => setChoosingDay(false)} />}
    </article>
  )
}
