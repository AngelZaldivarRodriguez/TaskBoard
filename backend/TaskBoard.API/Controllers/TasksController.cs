using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBoard.Application.Activities.Queries.GetTaskActivity;
using TaskBoard.Application.Tasks.Commands.CreateTask;
using TaskBoard.Application.Tasks.Commands.DeleteTask;
using TaskBoard.Application.Tasks.Commands.MoveTask;
using TaskBoard.Application.Tasks.Commands.UpdateTask;
using TaskBoard.Application.Tasks.Queries.GetTasks;
using TaskBoard.Domain.Entities;

namespace TaskBoard.API.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/tasks")]
[Authorize]
public class TasksController(IMediator mediator) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid projectId,
        [FromQuery] Guid? assigneeId,
        [FromQuery] TaskPriority? priority,
        [FromQuery] string? search,
        CancellationToken ct) =>
        Ok(await mediator.Send(new GetTasksQuery(projectId, assigneeId, priority, search), ct));

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, CreateTaskRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateTaskCommand(
            request.Title, request.Description, request.ColumnId,
            UserId, request.AssigneeId, request.Priority, request.DueDate), ct);
        return Ok(result);
    }

    [HttpPut("{taskId:guid}")]
    public async Task<IActionResult> Update(Guid taskId, UpdateTaskRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateTaskCommand(
            taskId, UserId, request.Title, request.Description,
            request.Priority, request.AssigneeId, request.DueDate), ct);
        return Ok(result);
    }

    [HttpPatch("{taskId:guid}/move")]
    public async Task<IActionResult> Move(Guid taskId, MoveTaskRequest request, CancellationToken ct)
    {
        await mediator.Send(new MoveTaskCommand(taskId, UserId, request.TargetColumnId, request.NewOrder), ct);
        return NoContent();
    }

    [HttpDelete("{taskId:guid}")]
    public async Task<IActionResult> Delete(Guid taskId, CancellationToken ct)
    {
        await mediator.Send(new DeleteTaskCommand(taskId, UserId), ct);
        return NoContent();
    }

    [HttpGet("{taskId:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid taskId, CancellationToken ct) =>
        Ok(await mediator.Send(new GetTaskActivityQuery(taskId), ct));
}

public record CreateTaskRequest(string Title, string? Description, Guid ColumnId, Guid? AssigneeId, TaskPriority Priority, DateTime? DueDate);
public record UpdateTaskRequest(string Title, string? Description, TaskPriority Priority, Guid? AssigneeId, DateTime? DueDate);
public record MoveTaskRequest(Guid TargetColumnId, int NewOrder);
