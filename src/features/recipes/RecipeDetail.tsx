import { useEngine } from '../../sync/EngineProvider'
import { useFeedback } from '../../ui/feedback'
import { useRecipe } from './hooks'
import { isFavorite, withFavorite } from './nutrition'
import { RecipeView } from './RecipeView'

export function RecipeDetail({ id, go }: { id: string; go: (path: string) => void }) {
  const engine = useEngine()
  const { showUndo, showInfo, confirm } = useFeedback()
  const recipe = useRecipe(id)

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

  const remove = async () => {
    const ok = await confirm({
      title: `¿Borrar «${recipe.title}»?`,
      message: 'Desaparecerá del recetario de todos los móviles.',
      confirmLabel: 'Sí, borrar',
      danger: true,
    })
    if (!ok) return
    await engine.remove('recipes', recipe.id)
    go('recetas')
    showUndo('Receta borrada', () => engine.restore('recipes', recipe.id))
  }

  return (
    <RecipeView
      recipe={recipe}
      onToggleFavorite={() => {
        const on = !isFavorite(recipe.tags)
        void engine.update('recipes', recipe.id, { tags: withFavorite(recipe.tags, on) })
        showInfo(on ? 'Añadida a favoritas ⭐' : 'Quitada de favoritas')
      }}
      footer={
        <div className="flex gap-3">
          <button onClick={() => go(`recetas/${recipe.id}/editar`)} className="min-h-14 flex-1 rounded-2xl border-2 border-borde bg-white text-lg font-semibold">
            ✏️ Editar
          </button>
          <button onClick={() => void remove()} className="min-h-14 flex-1 rounded-2xl border-2 border-terra bg-white text-lg font-semibold text-terra">
            🗑️ Borrar
          </button>
        </div>
      }
    />
  )
}
