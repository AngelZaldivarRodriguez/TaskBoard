using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Tasks.DTOs;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Tasks.Commands.CreateTask;

public record CreateTaskCommand(
    string Title, string? Description, Guid ColumnId,
    Guid CreatedById, Guid? AssigneeId, TaskPriority Priority, DateTime? DueDate)
    : IRequest<TaskDto>;

public class CreateTaskCommandHandler(IAppDbContext db, IBoardNotifier notifier)
    : IRequestHandler<CreateTaskCommand, TaskDto>
{
    public async Task<TaskDto> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        var maxOrder = await db.Tasks
            .Where(t => t.ColumnId == request.ColumnId)
            .Select(t => (int?)t.Order)
            .MaxAsync(cancellationToken) ?? -1;

        var column = await db.Columns.FirstAsync(c => c.Id == request.ColumnId, cancellationToken);

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            ColumnId = request.ColumnId,
            CreatedById = request.CreatedById,
            AssigneeId = request.AssigneeId,
            Priority = request.Priority,
            DueDate = request.DueDate,
            Order = maxOrder + 1,
        };

        db.Tasks.Add(task);

        db.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            UserId = request.CreatedById,
            Action = "created",
            NewValue = request.Title,
        });

        await db.SaveChangesAsync(cancellationToken);

        var dto = new TaskDto(task.Id, task.Title, task.Description, task.Priority.ToString(),
            task.Order, task.DueDate, task.ColumnId, task.AssigneeId, null, task.CreatedById, task.CreatedAt);

        await notifier.TaskCreated(column.ProjectId, dto);

        return dto;
    }
}
