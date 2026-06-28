namespace TaskBoard.Application.Columns.DTOs;

public record ColumnDto(Guid Id, string Name, int Order, Guid ProjectId);
