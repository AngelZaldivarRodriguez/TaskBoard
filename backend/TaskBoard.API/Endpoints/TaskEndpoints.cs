using System.Security.Claims;
using MediatR;
using TaskBoard.Application.Activities.Queries.GetTaskActivity;
using TaskBoard.Application.Tasks.Commands.CreateTask;
using TaskBoard.Application.Tasks.Commands.DeleteTask;
using TaskBoard.Application.Tasks.Commands.MoveTask;
using TaskBoard.Application.Tasks.Commands.UpdateTask;
using TaskBoard.Application.Tasks.Queries.GetTasks;
using TaskBoard.Domain.Entities;

namespace TaskBoard.API.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTasks(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:guid}/tasks")
            .RequireAuthorization()
            .WithTags("Tasks");

        group.MapGet("/", async (
            Guid projectId,
            IMediator mediator,
            CancellationToken ct,
            Guid? assigneeId = null,
            TaskPriority? priority = null,
            string? search = null) =>
            Results.Ok(await mediator.Send(new GetTasksQuery(projectId, assigneeId, priority, search), ct)));

        group.MapPost("/", async (Guid projectId, CreateTaskRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CreateTaskCommand(
                req.Title, req.Description, req.ColumnId,
                user.GetId(), req.AssigneeId, req.Priority, req.DueDate), ct);
            return Results.Ok(result);
        });

        group.MapPut("/{taskId:guid}", async (Guid projectId, Guid taskId, UpdateTaskRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateTaskCommand(
                taskId, user.GetId(), req.Title, req.Description,
                req.Priority, req.AssigneeId, req.DueDate), ct);
            return Results.Ok(result);
        });

        group.MapPatch("/{taskId:guid}/move", async (Guid projectId, Guid taskId, MoveTaskRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new MoveTaskCommand(taskId, user.GetId(), req.TargetColumnId, req.NewOrder), ct);
            return Results.NoContent();
        });

        group.MapDelete("/{taskId:guid}", async (Guid projectId, Guid taskId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new DeleteTaskCommand(taskId, user.GetId()), ct);
            return Results.NoContent();
        });

        group.MapGet("/{taskId:guid}/activity", async (Guid taskId, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetTaskActivityQuery(taskId), ct)));

        return app;
    }
}

public record CreateTaskRequest(string Title, string? Description, Guid ColumnId, Guid? AssigneeId, TaskPriority Priority, DateTime? DueDate);
public record UpdateTaskRequest(string Title, string? Description, TaskPriority Priority, Guid? AssigneeId, DateTime? DueDate);
public record MoveTaskRequest(Guid TargetColumnId, int NewOrder);
