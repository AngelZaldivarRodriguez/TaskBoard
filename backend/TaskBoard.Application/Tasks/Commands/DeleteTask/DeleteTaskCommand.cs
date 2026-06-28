using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Tasks.Commands.DeleteTask;

public record DeleteTaskCommand(Guid TaskId, Guid UserId) : IRequest;

public class DeleteTaskCommandHandler(IAppDbContext db, IBoardNotifier notifier)
    : IRequestHandler<DeleteTaskCommand>
{
    public async Task Handle(DeleteTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await db.Tasks
            .Include(t => t.Column)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken)
            ?? throw new NotFoundException(nameof(TaskItem), request.TaskId);

        var projectId = task.Column.ProjectId;

        db.Tasks.Remove(task);
        await db.SaveChangesAsync(cancellationToken);

        await notifier.TaskDeleted(projectId, request.TaskId);
    }
}
