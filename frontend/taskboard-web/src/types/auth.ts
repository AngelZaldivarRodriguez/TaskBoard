export interface AuthResponse {
  userId: string
  token: string
  email: string
  name: string
  role: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  name: string
}
