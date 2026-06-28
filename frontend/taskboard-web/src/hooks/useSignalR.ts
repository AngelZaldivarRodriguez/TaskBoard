import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'

// Hook personalizado — agrupa lógica reutilizable igual que un servicio en .NET
// Este hook maneja toda la conexión SignalR para un proyecto
export function useSignalR(projectId: string) {
  const queryClient = useQueryClient()
  // useRef: guarda un valor que persiste entre renders pero NO provoca re-render cuando cambia
  // Perfecto para guardar la conexión de SignalR
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')

    // Construir la conexión al hub de SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/board', {
        // SignalR no puede enviar el token en el header Authorization con WebSockets
        // En su lugar, lo manda como query param: /hubs/board?access_token=...
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect()   // Reconectar automáticamente si se cae
      .build()

    connectionRef.current = connection

    // Arrancar la conexión y unirse al grupo del proyecto
    connection.start().then(() => {
      connection.invoke('JoinProject', projectId)
    })

    // Cuando el servidor emite 'TaskCreated', 'TaskMoved', etc.,
    // invalidamos la caché de React Query → dispara un re-fetch automático
    // Este es el patrón clave: SignalR avisa, React Query actualiza la UI
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })

    connection.on('TaskCreated', invalidate)
    connection.on('TaskUpdated', invalidate)
    connection.on('TaskMoved', invalidate)
    connection.on('TaskDeleted', invalidate)

    // Cleanup: cuando el componente se desmonta, cerrar la conexión
    // Equivale al IDisposable.Dispose() de .NET
    return () => {
      connection.invoke('LeaveProject', projectId).finally(() => connection.stop())
    }
  }, [projectId, queryClient])

  return connectionRef
}
