import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { projectsApi } from '../api/projectsApi'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import type { Project } from '../types/project'

const ACCENT_COLORS = [
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-indigo-500',
]

function getAccentColor(name: string) {
  const idx = name.charCodeAt(0) % ACCENT_COLORS.length
  return ACCENT_COLORS[idx]
}

function ProjectInitial({ name }: { name: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${getAccentColor(name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const queryClient = useQueryClient()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between h-14 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/>
            </svg>
          </div>
          <span className="font-semibold text-zinc-900">TaskBoard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-300 hidden sm:block">{user?.name}</span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Mis proyectos</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {projects.length === 0 ? 'Sin proyectos todavía' : `${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">No hay proyectos aún</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Crea tu primer tablero Kanban para empezar.</p>
            <Button size="sm" onClick={() => setShowModal(true)}>Crear proyecto</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <ProjectInitial name={project.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">{project.name}</h3>
                      {project.ownerId === user?.userId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 rounded transition-colors"
                            onClick={() => setEditingProject(project)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            onClick={() => { if (confirm('¿Eliminar proyecto?')) deleteMutation.mutate(project.id) }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{project.ownerName}</p>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <span>{project.memberCount} miembro{project.memberCount !== 1 ? 's' : ''}</span>
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
        <Input label="Nombre" placeholder="Nombre del proyecto" {...register('name', { required: true })} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Descripción (opcional)</label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 resize-none"
            rows={3}
            placeholder="¿De qué trata este proyecto?"
            {...register('description')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? 'Guardar cambios' : 'Crear proyecto'}</Button>
        </div>
      </form>
    </Modal>
  )
}
