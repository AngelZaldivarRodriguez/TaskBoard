import { Routes, Route, Navigate } from 'react-router-dom'

// Por ahora solo una pantalla de bienvenida.
// Cada PR irá agregando rutas nuevas aquí.
function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">TaskBoard</h1>
              <p className="text-gray-500">Setup completo. Siguiente: PR 2 — Autenticación</p>
            </div>
          </div>
        }
      />
      {/* Redirigir cualquier ruta desconocida al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
