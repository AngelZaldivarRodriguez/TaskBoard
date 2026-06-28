namespace TaskBoard.Application.Tasks.DTOs;

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    string Priority,
    int Order,
    DateTime? DueDate,
    Guid ColumnId,
    Guid? AssigneeId,
    string? AssigneeName,
    Guid CreatedById,
    DateTime CreatedAt);
