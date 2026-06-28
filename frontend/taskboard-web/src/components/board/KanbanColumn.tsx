import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { tasksApi, columnsApi } from '../../api/boardApi'
import { TaskCard } from './TaskCard'
import { Button } from '../ui/Button'
import type { Column, Task } from '../../types/board'
import type { Member } from '../../types/project'

// Signature element: barra de color en el top de cada columna
const COLUMN_ACCENTS = [
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-indigo-500',
]

interface Props {
  column: Column
  tasks: Task[]
  projectId: string
  members: Member[]
  index: number
}

export function KanbanColumn({ column, tasks, projectId, members, index }: Props) {
  const [addingTask, setAddingTask] = useState(false)
  const queryClient = useQueryClient()

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const accentColor = COLUMN_ACCENTS[index % COLUMN_ACCENTS.length]

  const createTaskMutation = useMutation({
    mutationFn: (title: string) =>
      tasksApi.create(projectId, { title, columnId: column.id, priority: 'Medium' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setAddingTask(false)
    },
  })

  const deleteColumnMutation = useMutation({
    mutationFn: () => columnsApi.delete(projectId, column.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', projectId] }),
  })

  const { register, handleSubmit, reset } = useForm<{ title: string }>()

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header con barra de color arriba */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-2 shadow-sm">
        <div className={`h-1 ${accentColor}`} />
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{column.name}</h3>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-2 py-0.5 font-medium">{tasks.length}</span>
          </div>
          <button
            className="w-5 h-5 flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors text-base leading-none"
            onClick={() => { if (confirm('¿Eliminar columna?')) deleteColumnMutation.mutate() }}
          >×</button>
        </div>
      </div>

      {/* Lista de tareas */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-all ${isOver ? 'bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-200 dark:ring-violet-800' : 'bg-zinc-100/70 dark:bg-zinc-800/40'}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} members={members} />
          ))}
        </SortableContext>

        {addingTask ? (
          <form
            onSubmit={handleSubmit((d) => { createTaskMutation.mutate(d.title); reset() })}
            className="flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 shadow-sm"
          >
            <textarea
              autoFocus
              rows={2}
              placeholder="Título de la tarea..."
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              {...register('title', { required: true })}
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" loading={createTaskMutation.isPending}>Agregar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingTask(false); reset() }}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 rounded-lg py-2 px-3 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar tarea
          </button>
        )}
      </div>
    </div>
  )
}
