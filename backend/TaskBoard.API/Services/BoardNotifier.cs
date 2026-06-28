using Microsoft.AspNetCore.SignalR;
using TaskBoard.API.Hubs;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.API.Services;

// Este notifier SÍ conoce SignalR y vive en el API layer (que ya depende de SignalR)
// Lo registramos en Program.cs sobreescribiendo el NullBoardNotifier de Infrastructure
public class BoardNotifier(IHubContext<BoardHub> hubContext) : IBoardNotifier
{
    public Task TaskCreated(Guid projectId, object task) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskCreated", task);

    public Task TaskUpdated(Guid projectId, object task) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskUpdated", task);

    public Task TaskMoved(Guid projectId, object payload) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskMoved", payload);

    public Task TaskDeleted(Guid projectId, Guid taskId) =>
        hubContext.Clients.Group($"project-{projectId}").SendAsync("TaskDeleted", taskId);
}
