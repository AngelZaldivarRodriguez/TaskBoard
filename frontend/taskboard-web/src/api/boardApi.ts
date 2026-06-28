import type { ActivityLog, Column, Task } from '../types/board'
import client from './client'

export const columnsApi = {
  create: (projectId: string, name: string) =>
    client.post<Column>(`/projects/${projectId}/columns`, { name }).then((r) => r.data),

  update: (projectId: string, columnId: string, name: string) =>
    client.put(`/projects/${projectId}/columns/${columnId}`, { name }),

  delete: (projectId: string, columnId: string) =>
    client.delete(`/projects/${projectId}/columns/${columnId}`),

  reorder: (projectId: string, orderedIds: string[]) =>
    client.patch(`/projects/${projectId}/columns/reorder`, { orderedIds }),
}

export const tasksApi = {
  getAll: (projectId: string, filters?: { assigneeId?: string; priority?: string; search?: string }) =>
    client.get<Task[]>(`/projects/${projectId}/tasks`, { params: filters }).then((r) => r.data),

  create: (projectId: string, data: {
    title: string; description?: string; columnId: string
    assigneeId?: string; priority: string; dueDate?: string
  }) => client.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  update: (projectId: string, taskId: string, data: {
    title: string; description?: string; priority: string
    assigneeId?: string; dueDate?: string
  }) => client.put<Task>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),

  move: (projectId: string, taskId: string, targetColumnId: string, newOrder: number) =>
    client.patch(`/projects/${projectId}/tasks/${taskId}/move`, { targetColumnId, newOrder }),

  delete: (projectId: string, taskId: string) =>
    client.delete(`/projects/${projectId}/tasks/${taskId}`),

  getActivity: (projectId: string, taskId: string) =>
    client.get<ActivityLog[]>(`/projects/${projectId}/tasks/${taskId}/activity`).then((r) => r.data),
}
