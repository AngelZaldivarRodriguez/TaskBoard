using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Tasks.DTOs;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Tasks.Commands.UpdateTask;

public record UpdateTaskCommand(
    Guid TaskId, Guid UserId, string Title, string? Description,
    TaskPriority Priority, Guid? AssigneeId, DateTime? DueDate)
    : IRequest<TaskDto>;

public class UpdateTaskCommandHandler(IAppDbContext db, IBoardNotifier notifier)
    : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    public async Task<TaskDto> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await db.Tasks
            .Include(t => t.Column)
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException(nameof(TaskItem), request.TaskId);

        var oldTitle = task.Title;
        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = request.Priority;
        task.AssigneeId = request.AssigneeId;
        task.DueDate = request.DueDate;

        if (oldTitle != request.Title)
        {
            db.ActivityLogs.Add(new ActivityLog
            {
                Id = Guid.NewGuid(),
                TaskId = task.Id,
                UserId = request.UserId,
                Action = "title_changed",
                OldValue = oldTitle,
                NewValue = request.Title,
            });
        }

        await db.SaveChangesAsync(cancellationToken);

        var dto = new TaskDto(task.Id, task.Title, task.Description, task.Priority.ToString(),
            task.Order, task.DueDate, task.ColumnId, task.AssigneeId,
            task.Assignee?.Name, task.CreatedById, task.CreatedAt);

        await notifier.TaskUpdated(task.Column.ProjectId, dto);

        return dto;
    }
}
