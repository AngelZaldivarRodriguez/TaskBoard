using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Activities.DTOs;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Activities.Queries.GetTaskActivity;

public record GetTaskActivityQuery(Guid TaskId) : IRequest<List<ActivityDto>>;

public class GetTaskActivityQueryHandler(IAppDbContext db) : IRequestHandler<GetTaskActivityQuery, List<ActivityDto>>
{
    public async Task<List<ActivityDto>> Handle(GetTaskActivityQuery request, CancellationToken cancellationToken)
    {
        return await db.ActivityLogs
            .Include(a => a.User)
            .Where(a => a.TaskId == request.TaskId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ActivityDto(a.Id, a.Action, a.OldValue, a.NewValue, a.User.Name, a.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
