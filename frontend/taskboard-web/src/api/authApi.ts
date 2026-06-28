import type { AuthResponse, LoginForm, RegisterForm } from '../types/auth'
import client from './client'

export const authApi = {
  login: (data: LoginForm) =>
    client.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterForm) =>
    client.post<AuthResponse>('/auth/register', data).then((r) => r.data),
}
