namespace TaskBoard.Application.Auth.DTOs;

public record AuthResponseDto(Guid UserId, string Token, string Email, string Name, string Role);
