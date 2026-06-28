namespace TaskBoard.Domain.Entities;

public class TaskItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int Order { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid ColumnId { get; set; }
    public Guid? AssigneeId { get; set; }
    public Guid CreatedById { get; set; }

    public BoardColumn Column { get; set; } = default!;
    public User? Assignee { get; set; }
    public User CreatedBy { get; set; } = default!;
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
