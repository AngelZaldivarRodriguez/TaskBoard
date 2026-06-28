using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Columns.Commands.ReorderColumns;

public record ReorderColumnsCommand(Guid ProjectId, List<Guid> OrderedIds) : IRequest;

public class ReorderColumnsCommandHandler(IAppDbContext db) : IRequestHandler<ReorderColumnsCommand>
{
    public async Task Handle(ReorderColumnsCommand request, CancellationToken cancellationToken)
    {
        var columns = await db.Columns
            .Where(c => c.ProjectId == request.ProjectId)
            .ToListAsync(cancellationToken);

        for (int i = 0; i < request.OrderedIds.Count; i++)
        {
            var col = columns.FirstOrDefault(c => c.Id == request.OrderedIds[i]);
            if (col is not null) col.Order = i;
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
