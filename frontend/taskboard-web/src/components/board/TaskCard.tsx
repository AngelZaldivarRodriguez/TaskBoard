import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/board'
import type { Member } from '../../types/project'
import { TaskDetailModal } from '../tasks/TaskDetailModal'

const priorityColors: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

interface Props {
  task: Task
  projectId: string
  members: Member[]
}

export function TaskCard({ task, projectId, members }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  // useSortable: hook de dnd-kit que añade drag & drop a este elemento
  // attributes: props de accesibilidad (aria-*)
  // listeners: eventos del drag (onPointerDown, etc.)
  // setNodeRef: ref que dnd-kit necesita para saber la posición del elemento
  // transform / transition: para la animación mientras arrastras
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task }, // Datos que estarán disponibles en el evento drop
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
      >
        <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {task.assigneeName && (
            <span className="text-xs text-gray-400">{task.assigneeName}</span>
          )}
        </div>

        {task.dueDate && (
          <p className="text-xs text-gray-400 mt-2">
            📅 {new Date(task.dueDate).toLocaleDateString('es-MX')}
          </p>
        )}
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          projectId={projectId}
          members={members}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
