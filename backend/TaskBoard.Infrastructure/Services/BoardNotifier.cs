using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Infrastructure.Services;

// IBoardNotifier — no depende de SignalR directamente aquí
// La implementación real que usa IHubContext vive en el API project
// Para Infrastructure, usamos una versión que se inyecta desde afuera
public class NullBoardNotifier : IBoardNotifier
{
    public Task TaskCreated(Guid projectId, object task) => Task.CompletedTask;
    public Task TaskUpdated(Guid projectId, object task) => Task.CompletedTask;
    public Task TaskMoved(Guid projectId, object payload) => Task.CompletedTask;
    public Task TaskDeleted(Guid projectId, Guid taskId) => Task.CompletedTask;
}
