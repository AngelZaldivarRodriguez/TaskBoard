using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskBoard.API.Hubs;

[Authorize]
public class BoardHub : Hub
{
    // El cliente llama a este método para unirse al grupo de un proyecto
    // Grupo = canal de comunicación — solo los que están en el mismo proyecto reciben los eventos
    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
    }

    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project-{projectId}");
    }
}
