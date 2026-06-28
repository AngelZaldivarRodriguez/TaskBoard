import { useFilterStore } from '../../store/filterStore'
import type { Member } from '../../types/project'
import { Button } from '../ui/Button'

const PRIORITIES = [
  { value: 'Low', label: 'Baja' },
  { value: 'Medium', label: 'Media' },
  { value: 'High', label: 'Alta' },
  { value: 'Critical', label: 'Crítica' },
]

const inputClass = 'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900'

export function FilterBar({ members }: { members: Member[] }) {
  const { search, priority, assigneeId, setSearch, setPriority, setAssigneeId, reset } = useFilterStore()
  const hasFilters = search || priority || assigneeId

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          className={`${inputClass} pl-8 w-44`}
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="">Prioridad</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <select className={inputClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
        <option value="">Responsable</option>
        {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar
        </Button>
      )}
    </div>
  )
}
