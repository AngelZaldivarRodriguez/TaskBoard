using System.Security.Claims;
using MediatR;
using TaskBoard.Application.Columns.Commands.CreateColumn;
using TaskBoard.Application.Columns.Commands.DeleteColumn;
using TaskBoard.Application.Columns.Commands.ReorderColumns;
using TaskBoard.Application.Columns.Commands.UpdateColumn;

namespace TaskBoard.API.Endpoints;

public static class ColumnEndpoints
{
    public static IEndpointRouteBuilder MapColumns(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:guid}/columns")
            .RequireAuthorization()
            .WithTags("Columns");

        group.MapPost("/", async (Guid projectId, CreateColumnRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CreateColumnCommand(projectId, user.GetId(), req.Name), ct);
            return Results.Ok(result);
        });

        group.MapPut("/{columnId:guid}", async (Guid columnId, UpdateColumnRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new UpdateColumnCommand(columnId, user.GetId(), req.Name), ct);
            return Results.NoContent();
        });

        group.MapDelete("/{columnId:guid}", async (Guid columnId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new DeleteColumnCommand(columnId, user.GetId()), ct);
            return Results.NoContent();
        });

        group.MapPatch("/reorder", async (Guid projectId, ReorderRequest req, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new ReorderColumnsCommand(projectId, req.OrderedIds), ct);
            return Results.NoContent();
        });

        return app;
    }
}

public record CreateColumnRequest(string Name);
public record UpdateColumnRequest(string Name);
public record ReorderRequest(List<Guid> OrderedIds);
