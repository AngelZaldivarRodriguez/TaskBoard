using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Columns.DTOs;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Columns.Commands.CreateColumn;

public record CreateColumnCommand(Guid ProjectId, Guid UserId, string Name) : IRequest<ColumnDto>;

public class CreateColumnCommandHandler(IAppDbContext db) : IRequestHandler<CreateColumnCommand, ColumnDto>
{
    public async Task<ColumnDto> Handle(CreateColumnCommand request, CancellationToken cancellationToken)
    {
        var maxOrder = await db.Columns
            .Where(c => c.ProjectId == request.ProjectId)
            .Select(c => (int?)c.Order)
            .MaxAsync(cancellationToken) ?? -1;

        var column = new BoardColumn
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Order = maxOrder + 1,
            ProjectId = request.ProjectId,
        };

        db.Columns.Add(column);
        await db.SaveChangesAsync(cancellationToken);

        return new ColumnDto(column.Id, column.Name, column.Order, column.ProjectId);
    }
}
