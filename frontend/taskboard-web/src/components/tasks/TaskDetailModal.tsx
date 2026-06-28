import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../api/boardApi'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Task } from '../../types/board'
import type { Member } from '../../types/project'

const PRIORITIES = [
  { value: 'Low', label: 'Baja' },
  { value: 'Medium', label: 'Media' },
  { value: 'High', label: 'Alta' },
  { value: 'Critical', label: 'Crítica' },
]

const selectClass = 'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900'
const labelClass = 'text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide'

const actionLabels: Record<string, string> = {
  created: 'creó la tarea',
  moved: 'movió la tarea',
  title_changed: 'cambió el título',
}

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

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Descripción</label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 resize-none"
            rows={3}
            placeholder="Agrega una descripción..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Prioridad</label>
            <select className={selectClass} {...register('priority')}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Responsable</label>
            <select className={selectClass} {...register('assigneeId')}>
              <option value="">Sin asignar</option>
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <Input label="Fecha límite" type="date" {...register('dueDate')} />

        {/* Timeline de actividad */}
        {activity.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <p className={`${labelClass} mb-3`}>Historial</p>
            <ul className="flex flex-col gap-2.5 max-h-36 overflow-y-auto pr-1">
              {activity.map((log) => (
                <li key={log.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0 mt-0.5">
                    {log.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{log.userName}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> {actionLabels[log.action] ?? log.action}</span>
                    {log.newValue && <span className="text-xs text-zinc-500 dark:text-zinc-400 italic"> "{log.newValue}"</span>}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {new Date(log.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
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
            <Button type="submit" loading={updateMutation.isPending}>Guardar cambios</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
