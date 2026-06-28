using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Columns.Commands.DeleteColumn;

public record DeleteColumnCommand(Guid ColumnId, Guid UserId) : IRequest;

public class DeleteColumnCommandHandler(IAppDbContext db) : IRequestHandler<DeleteColumnCommand>
{
    public async Task Handle(DeleteColumnCommand request, CancellationToken cancellationToken)
    {
        var column = await db.Columns.FirstOrDefaultAsync(c => c.Id == request.ColumnId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.BoardColumn), request.ColumnId);

        db.Columns.Remove(column);
        await db.SaveChangesAsync(cancellationToken);
    }
}
