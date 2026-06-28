# TaskBoard

A full-stack Kanban board application built to demonstrate production-grade architecture patterns across the entire stack — Clean Architecture and CQRS on the backend, React with real-time collaboration via SignalR on the frontend.

![Board view with dark mode](docs/screenshots/board-dark.png)

## Features

- **Kanban boards** — drag & drop tasks between columns using dnd-kit
- **Real-time collaboration** — move a task in one browser tab and watch it update instantly in another via SignalR WebSockets
- **Multi-user projects** — invite members by email, assign tasks, set priorities and due dates
- **Activity history** — every task change is logged with a timeline (who moved it where, when)
- **Filters** — filter tasks by text search, priority, and assignee simultaneously
- **Dark mode** — persisted per-user via localStorage

---

## Architecture

This project is intentionally over-engineered for a personal tool — the goal is to showcase patterns used in enterprise .NET applications.

### Backend — Clean Architecture

```
TaskBoard.API/           ← Minimal API endpoints, SignalR Hub, middleware
TaskBoard.Application/   ← CQRS handlers (MediatR), interfaces, DTOs
TaskBoard.Domain/        ← Entities, enums — no dependencies
TaskBoard.Infrastructure/ ← EF Core, JWT, bcrypt implementations
```

The dependency rule flows inward: Domain knows nothing, Application knows Domain, Infrastructure and API know Application. This means the business logic in Application is testable in isolation without a database or HTTP context.

#### Why CQRS with MediatR?

Each operation is a self-contained class:

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

Each `Handler` receives its command, does exactly one thing, and returns. No shared mutable state between handlers. Adding a new operation means adding a new file, not modifying an existing one.

#### Minimal API

Endpoints are grouped using extension methods instead of controllers:

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

`RequireAuthorization()` on the group applies JWT auth to all endpoints inside it — no `[Authorize]` attribute needed per endpoint.

#### SignalR — Real-time layer

The Application layer defines an interface so handlers don't depend on SignalR directly:

```csharp
// Application layer — no SignalR reference
public interface IBoardNotifier
{
    Task TaskMoved(Guid projectId, object payload);
    Task TaskCreated(Guid projectId, object task);
    Task TaskUpdated(Guid projectId, object task);
    Task TaskDeleted(Guid projectId, Guid taskId);
}

// API layer — actual SignalR implementation
public class BoardNotifier(IHubContext<BoardHub> hubContext) : IBoardNotifier
{
    public Task TaskMoved(Guid projectId, object payload) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskMoved", payload);
}
```

The Hub uses SignalR Groups — each project is a named group. Clients join when they open a board and leave when they navigate away. Only users in the same project group receive events.

```csharp
[Authorize]
public class BoardHub : Hub
{
    public async Task JoinProject(string projectId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
}
```

#### Data model

```
User ──< ProjectMember >── Project ──< BoardColumn ──< TaskItem ──< ActivityLog
```

- A `User` can own many projects and be a member of others
- A `Project` has an ordered list of `BoardColumn`s
- A `TaskItem` has an `Order` field per column — reordering is done by updating all sibling orders in a single transaction
- Every `MoveTask` command writes an `ActivityLog` row with the column names (not IDs), so the history is readable even if columns are renamed or deleted

### Frontend — React 18

```
src/
  api/          ← Typed fetch wrappers (authApi, projectsApi, boardApi)
  components/
    board/      ← KanbanColumn, TaskCard, FilterBar
    tasks/      ← TaskDetailModal
    ui/         ← Button, Input, Modal, ThemeToggle (primitives)
  hooks/        ← useSignalR
  pages/        ← LoginPage, RegisterPage, DashboardPage, BoardPage
  store/        ← Zustand stores (auth, filters, theme)
  types/        ← TypeScript interfaces matching backend DTOs
```

#### State management split

Two different tools for two different jobs:

| What | Tool | Why |
|------|------|-----|
| Server state (tasks, projects) | TanStack Query | Caching, background refetch, loading/error states |
| Client state (auth token, filters, theme) | Zustand | Lightweight, persisted to localStorage |

TanStack Query's `queryKey` pattern makes filter-aware fetching automatic — when a filter changes, the key changes, and the query re-runs:

```typescript
useQuery({
  queryKey: ['tasks', projectId, { search, priority, assigneeId }],
  queryFn: () => tasksApi.getAll(projectId, { search, priority, assigneeId }),
})
```

#### Real-time with SignalR

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

When an event arrives, it invalidates the React Query cache — the UI re-fetches automatically. No manual state merging required.

#### Drag & Drop

dnd-kit handles drag & drop. Each `TaskCard` is a `useSortable` element; each `KanbanColumn` is a `useDroppable` zone. On drop:

1. Optimistic update is skipped intentionally — SignalR delivers the server state to all clients including the one that dragged, making optimistic updates redundant
2. `MoveTask` command runs on the server, reorders siblings in a transaction, fires `TaskMoved` via SignalR
3. All connected clients receive the event and re-fetch

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | ASP.NET Core 8 Minimal API |
| ORM | Entity Framework Core 8 + SQL Server |
| Mediator pattern | MediatR 12 |
| Real-time | ASP.NET Core SignalR |
| Authentication | JWT Bearer tokens |
| Password hashing | BCrypt.Net |
| Frontend framework | React 18 + TypeScript + Vite |
| Server state | TanStack Query v5 |
| Client state | Zustand v4 |
| Drag & drop | dnd-kit |
| Styling | Tailwind CSS v4 |
| Form validation | React Hook Form + Zod |
| Real-time client | @microsoft/signalr |

---

## Getting Started

### Prerequisites

- .NET 8 SDK
- SQL Server (or SQL Server Express / LocalDB)
- Node.js 18+

### Backend

```bash
cd backend

# Restore dependencies
dotnet restore

# Update appsettings.Development.json with your connection string and JWT key
# (see appsettings.json for the expected keys)

# Run migrations
dotnet ef database update --project TaskBoard.Infrastructure --startup-project TaskBoard.API

# Start the API (http://localhost:5000)
dotnet run --project TaskBoard.API
```

`appsettings.Development.json` minimum config:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TaskBoard;Trusted_Connection=True;"
  },
  "Jwt": {
    "Key": "your-secret-key-minimum-32-characters",
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

The Vite dev server proxies `/api` and `/hubs` to `http://localhost:5000` — no CORS configuration needed in development.

---

## Project Structure in Detail

### Backend walkthrough — what happens when you move a task

1. `PATCH /api/projects/{projectId}/tasks/{taskId}/move` arrives at `TaskEndpoints.cs`
2. The endpoint calls `mediator.Send(new MoveTaskCommand(...))`
3. `MoveTaskCommandHandler` runs:
   - Loads the task with its current column (to get the column name for the activity log)
   - Loads the target column
   - Reorders siblings in both source and destination columns
   - Writes an `ActivityLog` row: `{ action: "moved", oldValue: "Backlog", newValue: "In Progress" }`
   - Calls `IBoardNotifier.TaskMoved(...)` — which goes to `BoardNotifier` → `IHubContext<BoardHub>` → all clients in the project's SignalR group
4. All connected tabs receive `TaskMoved` and re-fetch their task list

### Frontend walkthrough — what the user sees

1. User drags a card — dnd-kit fires `onDragEnd`
2. `BoardPage` calls `tasksApi.move(...)` which sends the PATCH request
3. While waiting, the card stays in its original position (no optimistic update)
4. Server responds → SignalR fires `TaskMoved` to all clients in the project
5. `useSignalR` hook receives the event → calls `queryClient.invalidateQueries(['tasks', projectId])`
6. TanStack Query re-fetches → UI updates with server-authoritative order

---

## API Reference

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, name }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Get JWT token |

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | ✓ | List projects where user is owner or member |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/{id}` | ✓ | Get project with columns and members |
| PUT | `/api/projects/{id}` | ✓ Owner | Update project |
| DELETE | `/api/projects/{id}` | ✓ Owner | Delete project |
| POST | `/api/projects/{id}/members` | ✓ Owner | Add member by email |
| DELETE | `/api/projects/{id}/members/{memberId}` | ✓ Owner | Remove member |

### Columns

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{id}/columns` | Create column |
| PUT | `/api/projects/{id}/columns/{colId}` | Rename column |
| DELETE | `/api/projects/{id}/columns/{colId}` | Delete column |
| PATCH | `/api/projects/{id}/columns/reorder` | Reorder columns |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/{id}/tasks` | List tasks (supports `?search=&priority=&assigneeId=`) |
| POST | `/api/projects/{id}/tasks` | Create task |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Update task |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Delete task |
| PATCH | `/api/projects/{id}/tasks/{taskId}/move` | Move task to column |
| GET | `/api/projects/{id}/tasks/{taskId}/activity` | Get activity log |

### SignalR Hub

**Endpoint:** `/hubs/board`  
**Auth:** JWT via `?access_token=` query param (required by SignalR WebSocket protocol)

| Client → Server | Payload | Effect |
|-----------------|---------|--------|
| `JoinProject` | `projectId: string` | Adds connection to project's broadcast group |
| `LeaveProject` | `projectId: string` | Removes connection from group |

| Server → Client | Payload | Trigger |
|-----------------|---------|---------|
| `TaskMoved` | `{ taskId, fromColumnId, toColumnId, newOrder }` | MoveTask command |
| `TaskCreated` | Task DTO | CreateTask command |
| `TaskUpdated` | Task DTO | UpdateTask command |
| `TaskDeleted` | `{ taskId }` | DeleteTask command |

---

## Design Decisions

**Why not use a repository pattern on top of EF Core?**  
EF Core's `DbContext` is already a unit of work and `DbSet<T>` is already a repository. Adding another abstraction layer would be indirection without benefit. The Application layer depends on `IAppDbContext` (an interface over the DbContext) for testability.

**Why Minimal API instead of controllers?**  
Microsoft recommends Minimal API for new .NET 8 projects. It removes the ceremony of `ControllerBase` inheritance and `[HttpGet]`/`[Route]` attributes. The endpoint groups (`MapGroup`) provide the same route prefix and auth scoping that controller classes provide.

**Why is there no optimistic update on drag?**  
Because SignalR delivers the confirmed server state to all clients within ~50ms on a local network. Adding optimistic updates would mean maintaining two sources of truth and handling rollback on failure. The UX cost is acceptable given the benefit of always showing server-authoritative state.

**Why store column names instead of IDs in ActivityLog?**  
If you store `columnId` in the log, and the column is later deleted or renamed, the history becomes unreadable. Storing `"moved from 'Backlog' to 'In Progress'"` means the log is self-contained and readable forever.

---

## Screenshots

> Add screenshots to `docs/screenshots/` after running the app.
> Suggested shots: login page, dashboard with projects, board in light mode, board in dark mode, task detail modal with activity log.
