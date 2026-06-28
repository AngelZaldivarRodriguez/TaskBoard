using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBoard.Application.Projects.Commands.CreateProject;
using TaskBoard.Application.Projects.Commands.DeleteProject;
using TaskBoard.Application.Projects.Commands.UpdateProject;
using TaskBoard.Application.Projects.Queries.GetProject;
using TaskBoard.Application.Projects.Queries.GetProjects;

namespace TaskBoard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController(IMediator mediator) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await mediator.Send(new GetProjectsQuery(UserId), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await mediator.Send(new GetProjectQuery(id, UserId), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateProjectRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateProjectCommand(request.Name, request.Description, UserId), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateProjectRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateProjectCommand(id, UserId, request.Name, request.Description), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProjectCommand(id, UserId), ct);
        return NoContent();
    }
}

public record CreateProjectRequest(string Name, string? Description);
public record UpdateProjectRequest(string Name, string? Description);
