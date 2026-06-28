# TaskBoard

Aplicación de tableros Kanban full-stack construida para demostrar patrones de arquitectura de nivel productivo en toda la pila — Clean Architecture y CQRS en el backend, React con colaboración en tiempo real via SignalR en el frontend.

## Funcionalidades

- **Tableros Kanban** — arrastra y suelta tareas entre columnas usando dnd-kit
- **Colaboración en tiempo real** — mueve una tarea en una pestaña del navegador y mírala actualizarse instantáneamente en otra via WebSockets con SignalR
- **Proyectos multi-usuario** — invita miembros por email, asigna tareas, establece prioridades y fechas límite
- **Historial de actividad** — cada cambio en una tarea queda registrado con una línea de tiempo (quién la movió, a dónde y cuándo)
- **Filtros** — filtra tareas por búsqueda de texto, prioridad y responsable simultáneamente
- **Modo oscuro** — guardado por usuario via localStorage

---

## Arquitectura

Este proyecto está intencionalmente sobre-diseñado para una herramienta personal — el objetivo es mostrar los patrones usados en aplicaciones .NET empresariales.

### Backend — Clean Architecture

```
TaskBoard.API/           ← Endpoints Minimal API, SignalR Hub, middleware
TaskBoard.Application/   ← Handlers CQRS (MediatR), interfaces, DTOs
TaskBoard.Domain/        ← Entidades, enums — sin dependencias externas
TaskBoard.Infrastructure/ ← EF Core, JWT, implementaciones de bcrypt
```

La regla de dependencias fluye hacia adentro: Domain no conoce nada, Application conoce Domain, Infrastructure y API conocen Application. Esto significa que la lógica de negocio en Application es testeable de forma aislada sin una base de datos ni contexto HTTP.

#### Por qué CQRS con MediatR

Cada operación es una clase autocontenida:

```
Application/
  Tasks/
    Commands/
      CreateTask/CreateTaskCommand.cs   ← POST /tasks
      MoveTask/MoveTaskCommand.cs       ← PATCH /tasks/{id}/move
      UpdateTask/UpdateTaskCommand.cs   ← PUT /tasks/{id}
      DeleteTask/DeleteTaskCommand.cs   ← DELETE /tasks/{id}
    Queries/
      GetTasks/GetTasksQuery.cs         ← GET /tasks
```

Cada `Handler` recibe su comando, hace exactamente una cosa y retorna. Sin estado mutable compartido entre handlers. Agregar una nueva operación significa agregar un nuevo archivo, no modificar uno existente.

#### Minimal API

Los endpoints se agrupan usando métodos de extensión en lugar de controladores:

```csharp
// ProjectEndpoints.cs
public static IEndpointRouteBuilder MapProjects(this IEndpointRouteBuilder app)
{
    var group = app.MapGroup("/api/projects").RequireAuthorization();

    group.MapGet("/", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        Results.Ok(await mediator.Send(new GetProjectsQuery(user.GetId()), ct)));

    group.MapPost("/", async (CreateProjectRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        Results.Created(...));

    // ...
    return app;
}
```

`RequireAuthorization()` en el grupo aplica autenticación JWT a todos los endpoints dentro de él — no se necesita el atributo `[Authorize]` por endpoint.

#### SignalR — capa en tiempo real

La capa Application define una interfaz para que los handlers no dependan directamente de SignalR:

```csharp
// Capa Application — sin referencia a SignalR
public interface IBoardNotifier
{
    Task TaskMoved(Guid projectId, object payload);
    Task TaskCreated(Guid projectId, object task);
    Task TaskUpdated(Guid projectId, object task);
    Task TaskDeleted(Guid projectId, Guid taskId);
}

// Capa API — implementación real con SignalR
public class BoardNotifier(IHubContext<BoardHub> hubContext) : IBoardNotifier
{
    public Task TaskMoved(Guid projectId, object payload) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskMoved", payload);
}
```

El Hub usa Grupos de SignalR — cada proyecto es un grupo con nombre. Los clientes se unen cuando abren un tablero y se van cuando navegan a otra página. Solo los usuarios en el mismo grupo del proyecto reciben los eventos.

```csharp
[Authorize]
public class BoardHub : Hub
{
    public async Task JoinProject(string projectId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
}
```

#### Modelo de datos

```
User ──< ProjectMember >── Project ──< BoardColumn ──< TaskItem ──< ActivityLog
```

- Un `User` puede ser dueño de varios proyectos y miembro de otros
- Un `Project` tiene una lista ordenada de `BoardColumn`
- Un `TaskItem` tiene un campo `Order` por columna — el reordenamiento se hace actualizando todos los hermanos en una sola transacción
- Cada comando `MoveTask` escribe una fila en `ActivityLog` con los nombres de columna (no IDs), para que el historial sea legible incluso si las columnas son renombradas o eliminadas

### Frontend — React 18

```
src/
  api/          ← Wrappers de fetch tipados (authApi, projectsApi, boardApi)
  components/
    board/      ← KanbanColumn, TaskCard, FilterBar
    tasks/      ← TaskDetailModal
    ui/         ← Button, Input, Modal, ThemeToggle (primitivos)
  hooks/        ← useSignalR
  pages/        ← LoginPage, RegisterPage, DashboardPage, BoardPage
  store/        ← Stores de Zustand (auth, filtros, tema)
  types/        ← Interfaces TypeScript que corresponden a los DTOs del backend
```

#### División del estado

Dos herramientas distintas para dos trabajos distintos:

| Qué | Herramienta | Por qué |
|-----|-------------|---------|
| Estado del servidor (tareas, proyectos) | TanStack Query | Caché, refetch en segundo plano, estados de carga/error |
| Estado del cliente (token, filtros, tema) | Zustand | Liviano, persistido en localStorage |

El patrón `queryKey` de TanStack Query hace que el fetching con filtros sea automático — cuando un filtro cambia, la key cambia y la query se vuelve a ejecutar:

```typescript
useQuery({
  queryKey: ['tasks', projectId, { search, priority, assigneeId }],
  queryFn: () => tasksApi.getAll(projectId, { search, priority, assigneeId }),
})
```

#### Tiempo real con SignalR

```typescript
// hooks/useSignalR.ts
export function useSignalR(projectId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/board', { accessTokenFactory: () => getToken() })
      .withAutomaticReconnect()
      .build()

    connection.on('TaskMoved', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    })

    connection.start().then(() => connection.invoke('JoinProject', projectId))

    return () => { connection.stop() }
  }, [projectId])
}
```

Cuando llega un evento, invalida la caché de React Query — la UI vuelve a hacer fetch automáticamente. Sin sincronización manual de estado.

#### Drag & Drop

dnd-kit maneja el arrastrar y soltar. Cada `TaskCard` es un elemento `useSortable`; cada `KanbanColumn` es una zona `useDroppable`. Al soltar:

1. El optimistic update se omite intencionalmente — SignalR entrega el estado del servidor a todos los clientes incluyendo el que arrastró, haciendo redundante el optimistic update
2. El comando `MoveTask` se ejecuta en el servidor, reordena los hermanos en una transacción, dispara `TaskMoved` via SignalR
3. Todos los clientes conectados reciben el evento y vuelven a hacer fetch

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework backend | ASP.NET Core 8 Minimal API |
| ORM | Entity Framework Core 8 + SQL Server |
| Patrón mediador | MediatR 12 |
| Tiempo real | ASP.NET Core SignalR |
| Autenticación | JWT Bearer tokens |
| Hash de contraseñas | BCrypt.Net |
| Framework frontend | React 18 + TypeScript + Vite |
| Estado del servidor | TanStack Query v5 |
| Estado del cliente | Zustand v4 |
| Drag & drop | dnd-kit |
| Estilos | Tailwind CSS v4 |
| Validación de formularios | React Hook Form + Zod |
| Cliente tiempo real | @microsoft/signalr |

---

## Cómo correr el proyecto

### Requisitos

- .NET 8 SDK
- SQL Server (o SQL Server Express / LocalDB)
- Node.js 18+

### Backend

```bash
cd backend

# Restaurar dependencias
dotnet restore

# Crear appsettings.Development.json con tu connection string y JWT key
# (ver appsettings.json para las keys esperadas)

# Ejecutar migraciones
dotnet ef database update --project TaskBoard.Infrastructure --startup-project TaskBoard.API

# Iniciar la API (http://localhost:5000)
dotnet run --project TaskBoard.API
```

Configuración mínima en `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TaskBoard;Trusted_Connection=True;"
  },
  "Jwt": {
    "Key": "tu-clave-secreta-minimo-32-caracteres",
    "Issuer": "TaskBoard",
    "Audience": "TaskBoard"
  }
}
```

### Frontend

```bash
cd frontend/taskboard-web

npm install
npm run dev   # http://localhost:5173
```

El servidor de desarrollo de Vite hace proxy de `/api` y `/hubs` hacia `http://localhost:5000` — no se necesita configuración de CORS en desarrollo.

---

## Flujo de un request de punta a punta

### Backend — qué pasa cuando mueves una tarea

1. `PATCH /api/projects/{projectId}/tasks/{taskId}/move` llega a `TaskEndpoints.cs`
2. El endpoint llama `mediator.Send(new MoveTaskCommand(...))`
3. `MoveTaskCommandHandler` ejecuta:
   - Carga la tarea con su columna actual (para obtener el nombre de columna para el log)
   - Carga la columna destino
   - Reordena los hermanos en columna origen y destino en una sola transacción
   - Escribe una fila `ActivityLog`: `{ action: "moved", oldValue: "Backlog", newValue: "En Progreso" }`
   - Llama `IBoardNotifier.TaskMoved(...)` → `BoardNotifier` → `IHubContext<BoardHub>` → todos los clientes en el grupo SignalR del proyecto
4. Todas las pestañas conectadas reciben `TaskMoved` y vuelven a hacer fetch de sus tareas

### Frontend — qué ve el usuario

1. El usuario arrastra una card — dnd-kit dispara `onDragEnd`
2. `BoardPage` llama `tasksApi.move(...)` que envía el PATCH request
3. Mientras espera, la card se queda en su posición original (sin optimistic update)
4. El servidor responde → SignalR dispara `TaskMoved` a todos los clientes del proyecto
5. El hook `useSignalR` recibe el evento → llama `queryClient.invalidateQueries(['tasks', projectId])`
6. TanStack Query vuelve a hacer fetch → la UI se actualiza con el orden autoritativo del servidor

---

## Referencia de la API

### Auth

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, name }` | Crear cuenta |
| POST | `/api/auth/login` | `{ email, password }` | Obtener token JWT |

### Proyectos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/projects` | ✓ | Listar proyectos donde el usuario es dueño o miembro |
| POST | `/api/projects` | ✓ | Crear proyecto |
| GET | `/api/projects/{id}` | ✓ | Obtener proyecto con columnas y miembros |
| PUT | `/api/projects/{id}` | ✓ Dueño | Actualizar proyecto |
| DELETE | `/api/projects/{id}` | ✓ Dueño | Eliminar proyecto |
| POST | `/api/projects/{id}/members` | ✓ Dueño | Agregar miembro por email |
| DELETE | `/api/projects/{id}/members/{memberId}` | ✓ Dueño | Eliminar miembro |

### Columnas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/projects/{id}/columns` | Crear columna |
| PUT | `/api/projects/{id}/columns/{colId}` | Renombrar columna |
| DELETE | `/api/projects/{id}/columns/{colId}` | Eliminar columna |
| PATCH | `/api/projects/{id}/columns/reorder` | Reordenar columnas |

### Tareas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/projects/{id}/tasks` | Listar tareas (soporta `?search=&priority=&assigneeId=`) |
| POST | `/api/projects/{id}/tasks` | Crear tarea |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Actualizar tarea |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Eliminar tarea |
| PATCH | `/api/projects/{id}/tasks/{taskId}/move` | Mover tarea a otra columna |
| GET | `/api/projects/{id}/tasks/{taskId}/activity` | Obtener historial de actividad |

### SignalR Hub

**Endpoint:** `/hubs/board`  
**Auth:** JWT via query param `?access_token=` (requerido por el protocolo WebSocket de SignalR)

| Cliente → Servidor | Payload | Efecto |
|--------------------|---------|--------|
| `JoinProject` | `projectId: string` | Agrega la conexión al grupo de broadcast del proyecto |
| `LeaveProject` | `projectId: string` | Elimina la conexión del grupo |

| Servidor → Cliente | Payload | Disparado por |
|--------------------|---------|---------------|
| `TaskMoved` | `{ taskId, fromColumnId, toColumnId, newOrder }` | Comando MoveTask |
| `TaskCreated` | DTO de tarea | Comando CreateTask |
| `TaskUpdated` | DTO de tarea | Comando UpdateTask |
| `TaskDeleted` | `{ taskId }` | Comando DeleteTask |

---

## Decisiones de diseño

**¿Por qué no usar el patrón repositorio encima de EF Core?**  
El `DbContext` de EF Core ya es una unidad de trabajo y `DbSet<T>` ya es un repositorio. Agregar otra capa de abstracción sería indirección sin beneficio. La capa Application depende de `IAppDbContext` (una interfaz sobre el DbContext) para poder hacer pruebas.

**¿Por qué Minimal API en lugar de controladores?**  
Microsoft recomienda Minimal API para proyectos nuevos en .NET 8. Elimina la ceremonia de heredar `ControllerBase` y los atributos `[HttpGet]`/`[Route]`. Los grupos de endpoints (`MapGroup`) proveen el mismo prefijo de ruta y alcance de autenticación que proveen las clases de controladores.

**¿Por qué no hay optimistic update al arrastrar?**  
Porque SignalR entrega el estado confirmado del servidor a todos los clientes en ~50ms en una red local. Agregar optimistic updates significaría mantener dos fuentes de verdad y manejar el rollback ante fallos. El costo en UX es aceptable dado el beneficio de mostrar siempre el estado autoritativo del servidor.

**¿Por qué guardar nombres de columna en lugar de IDs en ActivityLog?**  
Si guardas el `columnId` en el log, y la columna es eliminada o renombrada después, el historial se vuelve ilegible. Guardar `"movida de 'Backlog' a 'En Progreso'"` significa que el log es autocontenido y legible para siempre.

