import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// QueryClient es el "gestor de caché" de React Query.
// Aquí configuramos cuánto tiempo viven los datos en caché.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Los datos se consideran "frescos" por 1 minuto
      retry: 1,             // Si falla una petición, reintenta 1 vez
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter: habilita la navegación por URL (React Router) */}
    <BrowserRouter>
      {/* QueryClientProvider: hace que React Query esté disponible en toda la app */}
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
