using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Projects.Commands.UpdateProject;

public record UpdateProjectCommand(Guid ProjectId, Guid UserId, string Name, string? Description) : IRequest;

public class UpdateProjectCommandHandler(IAppDbContext db) : IRequestHandler<UpdateProjectCommand>
{
    public async Task Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Project), request.ProjectId);

        if (project.OwnerId != request.UserId) throw new ForbiddenException();

        project.Name = request.Name;
        project.Description = request.Description;

        await db.SaveChangesAsync(cancellationToken);
    }
}
