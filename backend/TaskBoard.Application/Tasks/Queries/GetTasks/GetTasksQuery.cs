using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Tasks.DTOs;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Tasks.Queries.GetTasks;

public record GetTasksQuery(Guid ProjectId, Guid? AssigneeId = null, TaskPriority? Priority = null, string? Search = null)
    : IRequest<List<TaskDto>>;

public class GetTasksQueryHandler(IAppDbContext db) : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    public async Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken cancellationToken)
    {
        var query = db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Column)
            .Where(t => t.Column.ProjectId == request.ProjectId)
            .AsQueryable();

        if (request.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (request.Priority.HasValue)
            query = query.Where(t => t.Priority == request.Priority);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(t => t.Title.Contains(request.Search) || (t.Description != null && t.Description.Contains(request.Search)));

        return await query
            .OrderBy(t => t.Order)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.Description, t.Priority.ToString(),
                t.Order, t.DueDate, t.ColumnId,
                t.AssigneeId, t.Assignee != null ? t.Assignee.Name : null,
                t.CreatedById, t.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
