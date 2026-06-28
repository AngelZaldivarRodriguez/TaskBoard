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
import { ThemeToggle } from '../components/ui/ThemeToggle'
import type { Task } from '../types/board'

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()!
  const queryClient = useQueryClient()
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const { search, priority, assigneeId } = useFilterStore()

  useSignalR(projectId!)

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!),
  })

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
    activationConstraint: { distance: 8 },
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

    const targetColumnId = over.id as string
    if (draggedTask.columnId === targetColumnId) return

    const tasksInTarget = tasks.filter((t) => t.columnId === targetColumnId)
    moveMutation.mutate({ taskId: draggedTask.id, columnId: targetColumnId, order: tasksInTarget.length })
  }

  const columns = [...(project?.columns ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center gap-4 h-14 shrink-0">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Proyectos
        </Link>
        <span className="text-zinc-300">|</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/>
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {loadingProject ? '...' : project?.name}
          </h1>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* FilterBar */}
      <div className="px-6 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <FilterBar members={project?.members ?? []} />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-6 py-6">
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveTask(e.active.data.current?.task ?? null)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start min-h-full">
            {columns.map((col, index) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.id)}
                projectId={projectId!}
                members={project?.members ?? []}
                index={index}
              />
            ))}

            {/* Botón agregar columna */}
            <div className="w-72 shrink-0">
              {showAddColumn ? (
                <form
                  onSubmit={handleSubmit((d) => addColumnMutation.mutate(d.name))}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 flex flex-col gap-2 shadow-sm"
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
                  className="w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-4 text-sm text-zinc-400 dark:text-zinc-500 hover:border-violet-300 hover:text-violet-500 transition-colors"
                >
                  + Nueva columna
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white rounded-lg border border-violet-400 shadow-xl p-3 w-72 rotate-1 opacity-95">
                <p className="text-sm font-medium text-zinc-900">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
