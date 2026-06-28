import axios from 'axios'

// axios.create() crea una instancia con configuración base.
// Todas las llamadas al API usarán esta instancia, no el axios global.
const client = axios.create({
  baseURL: '/api', // El proxy de Vite redirige esto a http://localhost:5000/api
})

// Interceptor de request: antes de cada petición, agrega el token JWT al header
// Es como un middleware de .NET pero en el cliente
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response: si el servidor responde 401, limpiar sesión y redirigir
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
