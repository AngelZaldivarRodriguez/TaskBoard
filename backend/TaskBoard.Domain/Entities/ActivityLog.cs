namespace TaskBoard.Domain.Entities;

public class ActivityLog
{
    public Guid Id { get; set; }
    public string Action { get; set; } = default!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }

    public TaskItem Task { get; set; } = default!;
    public User User { get; set; } = default!;
}
