import type { Project, ProjectDetail } from '../types/project'
import client from './client'

export const projectsApi = {
  getAll: () => client.get<Project[]>('/projects').then((r) => r.data),

  getById: (id: string) => client.get<ProjectDetail>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    client.post<Project>('/projects', data).then((r) => r.data),

  update: (id: string, data: { name: string; description?: string }) =>
    client.put(`/projects/${id}`, data),

  delete: (id: string) => client.delete(`/projects/${id}`),
}
