using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Projects.DTOs;

namespace TaskBoard.Application.Projects.Queries.GetProject;

public record GetProjectQuery(Guid ProjectId, Guid UserId) : IRequest<ProjectDetailDto>;

public class GetProjectQueryHandler(IAppDbContext db) : IRequestHandler<GetProjectQuery, ProjectDetailDto>
{
    public async Task<ProjectDetailDto> Handle(GetProjectQuery request, CancellationToken cancellationToken)
    {
        var project = await db.Projects
            .Include(p => p.Members).ThenInclude(m => m.User)
            .Include(p => p.Columns)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Project), request.ProjectId);

        var hasAccess = project.OwnerId == request.UserId
            || project.Members.Any(m => m.UserId == request.UserId);

        if (!hasAccess) throw new ForbiddenException();

        return new ProjectDetailDto(
            project.Id, project.Name, project.Description, project.OwnerId,
            project.OwnerId == request.UserId,
            project.Members.Select(m => new MemberDto(m.UserId, m.User.Name, m.User.Email, m.Role.ToString())).ToList(),
            project.Columns.OrderBy(c => c.Order).Select(c => new ColumnSummaryDto(c.Id, c.Name, c.Order)).ToList(),
            project.CreatedAt);
    }
}
