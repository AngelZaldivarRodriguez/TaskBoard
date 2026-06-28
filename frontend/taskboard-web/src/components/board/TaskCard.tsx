import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/board'
import type { Member } from '../../types/project'
import { TaskDetailModal } from '../tasks/TaskDetailModal'

const PRIORITY_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  Low:      { label: 'Baja',     className: 'bg-zinc-100 text-zinc-500',       dot: 'bg-zinc-400' },
  Medium:   { label: 'Media',    className: 'bg-violet-50 text-violet-600',     dot: 'bg-violet-500' },
  High:     { label: 'Alta',     className: 'bg-amber-50 text-amber-600',       dot: 'bg-amber-500' },
  Critical: { label: 'Crítica',  className: 'bg-red-50 text-red-600',           dot: 'bg-red-500' },
}

interface Props {
  task: Task
  projectId: string
  members: Member[]
}

export function TaskCard({ task, projectId, members }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Medium

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetail(true)}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">{task.title}</p>

        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${priority.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>
          {task.assigneeName && (
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0" title={task.assigneeName}>
              {task.assigneeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            {new Date(task.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          </div>
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
