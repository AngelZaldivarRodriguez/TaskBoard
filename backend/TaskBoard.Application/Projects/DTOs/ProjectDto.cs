namespace TaskBoard.Application.Projects.DTOs;

public record ProjectDto(Guid Id, string Name, string? Description, Guid OwnerId, string OwnerName, int MemberCount, DateTime CreatedAt);

public record ProjectDetailDto(Guid Id, string Name, string? Description, Guid OwnerId, bool IsOwner, List<MemberDto> Members, List<ColumnSummaryDto> Columns, DateTime CreatedAt);

public record ColumnSummaryDto(Guid Id, string Name, int Order);

public record MemberDto(Guid UserId, string Name, string Email, string Role);
