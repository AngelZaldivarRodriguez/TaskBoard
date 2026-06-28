import { useFilterStore } from '../../store/filterStore'
import type { Member } from '../../types/project'
import { Button } from '../ui/Button'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export function FilterBar({ members }: { members: Member[] }) {
  const { search, priority, assigneeId, setSearch, setPriority, setAssigneeId, reset } = useFilterStore()
  const hasFilters = search || priority || assigneeId

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        placeholder="Buscar tareas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="">Todas las prioridades</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
      >
        <option value="">Todos los miembros</option>
        {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset}>✕ Limpiar</Button>
      )}
    </div>
  )
}
