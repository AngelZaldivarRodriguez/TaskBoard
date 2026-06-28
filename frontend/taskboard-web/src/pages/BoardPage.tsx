import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useForm } from 'react-hook-form'
import { projectsApi } from '../api/projectsApi'
import { tasksApi, columnsApi } from '../api/boardApi'
import { useSignalR } from '../hooks/useSignalR'
import { useFilterStore } from '../store/filterStore'
import { KanbanColumn } from '../components/board/KanbanColumn'
import { FilterBar } from '../components/board/FilterBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { Task } from '../types/board'

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()!
  const queryClient = useQueryClient()
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const { search, priority, assigneeId } = useFilterStore()

  // Activa la conexión SignalR — cualquier evento del server invalida la caché de tareas
  useSignalR(projectId!)

  // Detalle del proyecto (incluye columnas y miembros)
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!),
  })

  // Tareas del proyecto con filtros aplicados
  // La queryKey incluye los filtros — cuando cambia un filtro, React Query re-fetcha
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId, { search, priority, assigneeId }],
    queryFn: () => tasksApi.getAll(projectId!, {
      search: search || undefined,
      priority: priority || undefined,
      assigneeId: assigneeId || undefined,
    }),
    enabled: !!projectId,
  })

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // Drag empieza solo si mueves 8px (evita clicks accidentales)
  }))

  const moveMutation = useMutation({
    mutationFn: ({ taskId, columnId, order }: { taskId: string; columnId: string; order: number }) =>
      tasksApi.move(projectId!, taskId, columnId, order),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const addColumnMutation = useMutation({
    mutationFn: (name: string) => columnsApi.create(projectId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setShowAddColumn(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<{ name: string }>()

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const draggedTask = active.data.current?.task as Task | undefined
    if (!draggedTask) return

    // over.id puede ser el id de una columna (droppable) o de otra tarea (sortable)
    // Para simplificar, siempre movemos al final de la columna destino
    const targetColumnId = over.id as string
    if (draggedTask.columnId === targetColumnId) return

    const tasksInTarget = tasks.filter((t) => t.columnId === targetColumnId)
    moveMutation.mutate({ taskId: draggedTask.id, columnId: targetColumnId, order: tasksInTarget.length })
  }

  const columns = [...(project?.columns ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Proyectos</Link>
        <h1 className="text-lg font-semibold text-gray-900">
          {loadingProject ? '...' : project?.name}
        </h1>
      </header>

      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <FilterBar members={project?.members ?? []} />
      </div>

      <div className="flex-1 overflow-x-auto px-6 py-6">
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveTask(e.active.data.current?.task ?? null)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.id)}
                projectId={projectId!}
                members={project?.members ?? []}
              />
            ))}

            <div className="w-72 shrink-0">
              {showAddColumn ? (
                <form
                  onSubmit={handleSubmit((d) => addColumnMutation.mutate(d.name))}
                  className="bg-gray-100 rounded-xl p-3 flex flex-col gap-2"
                >
                  <Input autoFocus placeholder="Nombre de la columna" {...register('name', { required: true })} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" loading={addColumnMutation.isPending}>Agregar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddColumn(false)}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  + Nueva columna
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white rounded-lg border border-blue-400 shadow-xl p-3 w-72 rotate-2">
                <p className="text-sm font-medium text-gray-900">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
