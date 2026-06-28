using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Tasks.Commands.MoveTask;

public record MoveTaskCommand(Guid TaskId, Guid UserId, Guid TargetColumnId, int NewOrder) : IRequest;

public class MoveTaskCommandHandler(IAppDbContext db, IBoardNotifier notifier)
    : IRequestHandler<MoveTaskCommand>
{
    public async Task Handle(MoveTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await db.Tasks
            .Include(t => t.Column)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException(nameof(TaskItem), request.TaskId);

        var projectId = task.Column.ProjectId;
        var oldColumnId = task.ColumnId;

        // Re-ordenar tareas en la columna origen (cerrar el hueco)
        var sourceTasks = await db.Tasks
            .Where(t => t.ColumnId == oldColumnId && t.Id != request.TaskId)
            .OrderBy(t => t.Order)
            .ToListAsync(cancellationToken);

        for (int i = 0; i < sourceTasks.Count; i++)
            sourceTasks[i].Order = i;

        // Re-ordenar tareas en la columna destino (abrir hueco)
        var destTasks = await db.Tasks
            .Where(t => t.ColumnId == request.TargetColumnId && t.Id != request.TaskId)
            .OrderBy(t => t.Order)
            .ToListAsync(cancellationToken);

        for (int i = 0; i < destTasks.Count; i++)
        {
            if (i >= request.NewOrder)
                destTasks[i].Order = i + 1;
        }

        task.ColumnId = request.TargetColumnId;
        task.Order = request.NewOrder;

        db.ActivityLogs.Add(new ActivityLog
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            UserId = request.UserId,
            Action = "moved",
            OldValue = oldColumnId.ToString(),
            NewValue = request.TargetColumnId.ToString(),
        });

        await db.SaveChangesAsync(cancellationToken);

        await notifier.TaskMoved(projectId, new
        {
            taskId = task.Id,
            fromColumnId = oldColumnId,
            toColumnId = request.TargetColumnId,
            newOrder = request.NewOrder
        });
    }
}
