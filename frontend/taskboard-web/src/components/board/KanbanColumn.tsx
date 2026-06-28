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

interface Props {
  column: Column
  tasks: Task[]
  projectId: string
  members: Member[]
}

export function KanbanColumn({ column, tasks, projectId, members }: Props) {
  const [addingTask, setAddingTask] = useState(false)
  const queryClient = useQueryClient()

  // useDroppable: marca este div como zona donde se puede soltar una tarea
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

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
      {/* Header de la columna */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 text-sm">{column.name}</h3>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        <button
          className="text-gray-300 hover:text-red-400 text-lg leading-none"
          onClick={() => { if (confirm('¿Eliminar columna?')) deleteColumnMutation.mutate() }}
        >×</button>
      </div>

      {/* Lista de tareas — SortableContext habilita el reorden dentro de la columna */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors ${isOver ? 'bg-blue-50' : 'bg-gray-100'}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} members={members} />
          ))}
        </SortableContext>

        {/* Formulario inline para agregar tarea */}
        {addingTask ? (
          <form
            onSubmit={handleSubmit((d) => { createTaskMutation.mutate(d.title); reset() })}
            className="flex flex-col gap-2"
          >
            <textarea
              autoFocus
              rows={2}
              placeholder="Título de la tarea..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
              {...register('title', { required: true })}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={createTaskMutation.isPending}>Agregar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingTask(false)}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg py-2 px-3 text-left transition-colors"
          >
            + Agregar tarea
          </button>
        )}
      </div>
    </div>
  )
}
