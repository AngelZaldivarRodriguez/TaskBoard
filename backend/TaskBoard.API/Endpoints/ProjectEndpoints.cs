using System.Security.Claims;
using MediatR;
using TaskBoard.Application.Projects.Commands.AddMember;
using TaskBoard.Application.Projects.Commands.CreateProject;
using TaskBoard.Application.Projects.Commands.DeleteProject;
using TaskBoard.Application.Projects.Commands.RemoveMember;
using TaskBoard.Application.Projects.Commands.UpdateProject;
using TaskBoard.Application.Projects.Queries.GetProject;
using TaskBoard.Application.Projects.Queries.GetProjects;
using TaskBoard.Domain.Entities;

namespace TaskBoard.API.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjects(this IEndpointRouteBuilder app)
    {
        // .RequireAuthorization() aplica a todos los endpoints del grupo de una vez
        var group = app.MapGroup("/api/projects").RequireAuthorization().WithTags("Projects");

        group.MapGet("/", async (ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetProjectsQuery(user.GetId()), ct)));

        group.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new GetProjectQuery(id, user.GetId()), ct)));

        group.MapPost("/", async (CreateProjectRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CreateProjectCommand(req.Name, req.Description, user.GetId()), ct);
            return Results.Created($"/api/projects/{result.Id}", result);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateProjectRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new UpdateProjectCommand(id, user.GetId(), req.Name, req.Description), ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new DeleteProjectCommand(id, user.GetId()), ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:guid}/members", async (Guid id, AddMemberRequest req, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new AddMemberCommand(id, user.GetId(), req.Email, req.Role), ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}/members/{memberId:guid}", async (Guid id, Guid memberId, ClaimsPrincipal user, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new RemoveMemberCommand(id, user.GetId(), memberId), ct);
            return Results.NoContent();
        });

        return app;
    }
}

public record CreateProjectRequest(string Name, string? Description);
public record UpdateProjectRequest(string Name, string? Description);
public record AddMemberRequest(string Email, UserRole Role);
