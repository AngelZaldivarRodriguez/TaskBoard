using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Exceptions;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Columns.Commands.UpdateColumn;

public record UpdateColumnCommand(Guid ColumnId, Guid UserId, string Name) : IRequest;

public class UpdateColumnCommandHandler(IAppDbContext db) : IRequestHandler<UpdateColumnCommand>
{
    public async Task Handle(UpdateColumnCommand request, CancellationToken cancellationToken)
    {
        var column = await db.Columns.FirstOrDefaultAsync(c => c.Id == request.ColumnId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.BoardColumn), request.ColumnId);

        column.Name = request.Name;
        await db.SaveChangesAsync(cancellationToken);
    }
}
