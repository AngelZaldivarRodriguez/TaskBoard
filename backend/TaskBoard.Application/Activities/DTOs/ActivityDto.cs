namespace TaskBoard.Application.Activities.DTOs;

public record ActivityDto(Guid Id, string Action, string? OldValue, string? NewValue, string UserName, DateTime CreatedAt);
