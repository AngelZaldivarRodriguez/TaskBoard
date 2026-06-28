using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Projects.Commands.DeleteProject;

public record DeleteProjectCommand(Guid ProjectId, Guid UserId) : IRequest;

public class DeleteProjectCommandHandler(IAppDbContext db) : IRequestHandler<DeleteProjectCommand>
{
    public async Task Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Project), request.ProjectId);

        if (project.OwnerId != request.UserId) throw new ForbiddenException();

        db.Projects.Remove(project);
        await db.SaveChangesAsync(cancellationToken);
    }
}
