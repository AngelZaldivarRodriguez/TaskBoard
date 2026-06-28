using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Projects.Commands.RemoveMember;

public record RemoveMemberCommand(Guid ProjectId, Guid OwnerId, Guid MemberId) : IRequest;

public class RemoveMemberCommandHandler(IAppDbContext db) : IRequestHandler<RemoveMemberCommand>
{
    public async Task Handle(RemoveMemberCommand request, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException(nameof(Project), request.ProjectId);

        if (project.OwnerId != request.OwnerId) throw new ForbiddenException();

        var membership = await db.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == request.ProjectId && pm.UserId == request.MemberId, cancellationToken)
            ?? throw new NotFoundException("Membership", request.MemberId);

        db.ProjectMembers.Remove(membership);
        await db.SaveChangesAsync(cancellationToken);
    }
}
