import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '../services/categories'
import type { Category } from '../types'

interface Props {
  selected: string | null
  onSelect: (id: string | null) => void
}

export function Sidebar({ selected, onSelect }: Props) {
  const { data = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    staleTime: 1000 * 60 * 10
  })

  return (
    <aside
      className="hidden md:flex fixed inset-y-0 left-0 w-72 border-r border-border bg-surface p-4 flex-col overflow-y-auto scroll-area"
      style={{ scrollbarGutter: 'stable' }}
    >
      <h2 className="text-sm text-gray-400 mb-3 shrink-0">Categorias</h2>
      <nav className="flex flex-col gap-1">
          <button
            className={`text-left px-3 py-2 rounded-md transition-colors ${!selected ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:text-primary'}`}
            onClick={() => onSelect(null)}
          >
            Todas
          </button>
          {isLoading && <div className="px-3 py-2 text-gray-500 text-sm">Carregando...</div>}
          {data.map((c) => (
            <button
              key={c._id}
              className={`text-left px-3 py-2 rounded-md transition-colors ${selected === c._id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:text-primary'}`}
              onClick={() => onSelect(c._id)}
            >
              {c.Nome}
            </button>
          ))}
      </nav>
    </aside>
  )
}
