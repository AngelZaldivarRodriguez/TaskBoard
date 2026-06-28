using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskBoard.Application.Columns.Commands.CreateColumn;
using TaskBoard.Application.Columns.Commands.DeleteColumn;
using TaskBoard.Application.Columns.Commands.ReorderColumns;
using TaskBoard.Application.Columns.Commands.UpdateColumn;

namespace TaskBoard.API.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/columns")]
[Authorize]
public class ColumnsController(IMediator mediator) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, CreateColumnRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateColumnCommand(projectId, UserId, request.Name), ct);
        return Ok(result);
    }

    [HttpPut("{columnId:guid}")]
    public async Task<IActionResult> Update(Guid columnId, UpdateColumnRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateColumnCommand(columnId, UserId, request.Name), ct);
        return NoContent();
    }

    [HttpDelete("{columnId:guid}")]
    public async Task<IActionResult> Delete(Guid columnId, CancellationToken ct)
    {
        await mediator.Send(new DeleteColumnCommand(columnId, UserId), ct);
        return NoContent();
    }

    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder(Guid projectId, ReorderRequest request, CancellationToken ct)
    {
        await mediator.Send(new ReorderColumnsCommand(projectId, request.OrderedIds), ct);
        return NoContent();
    }
}

public record CreateColumnRequest(string Name);
public record UpdateColumnRequest(string Name);
public record ReorderRequest(List<Guid> OrderedIds);
