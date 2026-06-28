import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy: todas las peticiones a /api se redirigen al backend .NET
    // Así React no necesita saber el puerto del backend
    proxy: {
      '/api': 'http://localhost:5000',
      '/hubs': {
        target: 'http://localhost:5000',
        ws: true, // Importante para WebSockets de SignalR
      },
    },
  },
})
