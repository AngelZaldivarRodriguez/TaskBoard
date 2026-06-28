using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Projects.Commands.AddMember;

public record AddMemberCommand(Guid ProjectId, Guid OwnerId, string MemberEmail, UserRole Role) : IRequest;

public class AddMemberCommandHandler(IAppDbContext db) : IRequestHandler<AddMemberCommand>
{
    public async Task Handle(AddMemberCommand request, CancellationToken cancellationToken)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException(nameof(Project), request.ProjectId);

        if (project.OwnerId != request.OwnerId) throw new ForbiddenException();

        var member = await db.Users.FirstOrDefaultAsync(u => u.Email == request.MemberEmail, cancellationToken)
            ?? throw new NotFoundException("User", request.MemberEmail);

        var alreadyMember = await db.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == request.ProjectId && pm.UserId == member.Id, cancellationToken);

        if (alreadyMember) throw new InvalidOperationException("El usuario ya es miembro del proyecto.");

        db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = request.ProjectId,
            UserId = member.Id,
            Role = request.Role,
        });

        await db.SaveChangesAsync(cancellationToken);
    }
}
