import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../api/boardApi'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Task } from '../../types/board'
import type { Member } from '../../types/project'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

interface Props {
  task: Task
  projectId: string
  members: Member[]
  onClose: () => void
}

export function TaskDetailModal({ task, projectId, members, onClose }: Props) {
  const queryClient = useQueryClient()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      assigneeId: task.assigneeId ?? '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    },
  })

  // Historial de actividad de esta tarea
  const { data: activity = [] } = useQuery({
    queryKey: ['activity', task.id],
    queryFn: () => tasksApi.getActivity(projectId, task.id),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[2]) =>
      tasksApi.update(projectId, task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['activity', task.id] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(projectId, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      onClose()
    },
  })

  const actionLabels: Record<string, string> = {
    created: 'creó la tarea',
    moved: 'movió la tarea',
    title_changed: 'cambió el título',
  }

  return (
    <Modal title="Detalle de tarea" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => updateMutation.mutate({
        title: d.title,
        description: d.description || undefined,
        priority: d.priority as Task['priority'],
        assigneeId: d.assigneeId || undefined,
        dueDate: d.dueDate || undefined,
      }))} className="flex flex-col gap-4">

        <Input label="Título" {...register('title', { required: true })} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows={3}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Prioridad</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Asignado a</label>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('assigneeId')}>
              <option value="">Sin asignar</option>
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <Input label="Fecha límite" type="date" {...register('dueDate')} />

        {/* Timeline de actividad */}
        {activity.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Historial</p>
            <ul className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {activity.map((log) => (
                <li key={log.id} className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{log.userName}</span>{' '}
                  {actionLabels[log.action] ?? log.action}
                  {log.newValue && <span className="italic"> "{log.newValue}"</span>}
                  <span className="ml-1 text-gray-400">{new Date(log.createdAt).toLocaleString('es-MX')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => { if (confirm('¿Eliminar tarea?')) deleteMutation.mutate() }}
            loading={deleteMutation.isPending}
          >
            Eliminar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={updateMutation.isPending}>Guardar</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
