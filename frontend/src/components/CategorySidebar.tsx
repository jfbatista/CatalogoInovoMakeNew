import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '../services/categories'
import type { Category } from '../types/category'

interface CategorySidebarProps {
  selected?: string | null
  onSelect: (id: string | null) => void
}

export function CategorySidebar({ selected, onSelect }: CategorySidebarProps) {
  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <aside className="sticky top-20 h-[calc(100vh-6rem)] hidden md:block w-64 shrink-0">
      <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
        <h2 className="px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)]">Categorias</h2>
        <nav className="flex flex-col gap-1">
          <button
            className={`text-left px-3 py-2 rounded-md transition-colors ${!selected ? 'bg-[var(--color-surface)] text-[var(--color-text)] border border-transparent hover:border-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
            onClick={() => onSelect(null)}
          >
            Todas
          </button>
          {isLoading && (
            <div className="px-3 py-2 text-[var(--color-text-secondary)] text-sm">Carregando...</div>
          )}
          {data?.map((cat) => (
            <button
              key={cat._id}
              className={`text-left px-3 py-2 rounded-md transition-colors ${selected === cat._id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]'}`}
              onClick={() => onSelect(cat._id)}
              title={cat.Nome}
            >
              {cat.Nome}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
