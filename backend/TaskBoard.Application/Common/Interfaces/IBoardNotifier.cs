namespace TaskBoard.Application.Common.Interfaces;

// Abstracción sobre SignalR — Application no sabe que SignalR existe
public interface IBoardNotifier
{
    Task TaskCreated(Guid projectId, object task);
    Task TaskUpdated(Guid projectId, object task);
    Task TaskMoved(Guid projectId, object payload);
    Task TaskDeleted(Guid projectId, Guid taskId);
}
