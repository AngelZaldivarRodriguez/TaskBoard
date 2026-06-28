import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { projectsApi } from '../api/projectsApi'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Project } from '../types/project'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // useQueryClient: acceso al cliente de React Query para invalidar caché manualmente
  const queryClient = useQueryClient()

  // useQuery: hace GET /api/projects y cachea el resultado
  // ['projects'] es la "cache key" — como un nombre para este dato en la caché
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      // Invalida la caché de 'projects' — React Query re-fetcha automáticamente
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditingProject(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TaskBoard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Cerrar sesión</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Mis proyectos</h2>
          <Button onClick={() => setShowModal(true)}>+ Nuevo proyecto</Button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No tienes proyectos aún.</p>
            <p className="text-sm mt-1">Crea uno para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  {project.ownerId === user?.userId && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-xs text-gray-400 hover:text-blue-500 px-1"
                        onClick={() => setEditingProject(project)}
                      >✏️</button>
                      <button
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        onClick={() => { if (confirm('¿Eliminar proyecto?')) deleteMutation.mutate(project.id) }}
                      >🗑️</button>
                    </div>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>👤 {project.memberCount} miembros</span>
                  <span>·</span>
                  <span>{project.ownerName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(showModal || editingProject) && (
        <ProjectModal
          initial={editingProject ?? undefined}
          onClose={() => { setShowModal(false); setEditingProject(null) }}
          onSubmit={(data) => {
            if (editingProject) updateMutation.mutate({ id: editingProject.id, data })
            else createMutation.mutate(data)
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function ProjectModal({ initial, onClose, onSubmit, loading }: {
  initial?: Project
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
  loading: boolean
}) {
  const { register, handleSubmit } = useForm({
    defaultValues: { name: initial?.name ?? '', description: initial?.description ?? '' },
  })

  return (
    <Modal title={initial ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nombre" {...register('name', { required: true })} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows={3}
            {...register('description')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  )
}
