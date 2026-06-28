export interface Column {
  id: string
  name: string
  order: number
  projectId: string
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: Priority
  order: number
  dueDate: string | null
  columnId: string
  assigneeId: string | null
  assigneeName: string | null
  createdById: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  userName: string
  createdAt: string
}
