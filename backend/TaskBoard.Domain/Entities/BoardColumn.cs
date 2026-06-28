namespace TaskBoard.Domain.Entities;

public class BoardColumn
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int Order { get; set; }
    public Guid ProjectId { get; set; }

    public Project Project { get; set; } = default!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
