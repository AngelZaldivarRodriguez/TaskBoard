import { create } from 'zustand'
import type { AuthResponse } from '../types/auth'

// Zustand: define el "shape" del estado y las acciones en un solo objeto.
// Es como un Singleton con getters y setters, pero reactivo (React se re-renderiza cuando cambia).

interface AuthState {
  user: AuthResponse | null
  isAuthenticated: boolean
  login: (data: AuthResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial: intentar recuperar la sesión del localStorage
  user: (() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) return JSON.parse(userStr) as AuthResponse
    return null
  })(),

  isAuthenticated: !!localStorage.getItem('token'),

  login: (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    set({ user: data, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },
}))
