using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Projects.DTOs;

namespace TaskBoard.Application.Projects.Queries.GetProjects;

public record GetProjectsQuery(Guid UserId) : IRequest<List<ProjectDto>>;

public class GetProjectsQueryHandler(IAppDbContext db) : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    public async Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        return await db.Projects
            .Where(p => p.OwnerId == request.UserId || p.Members.Any(m => m.UserId == request.UserId))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Description, p.OwnerId,
                p.Owner.Name, p.Members.Count, p.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
