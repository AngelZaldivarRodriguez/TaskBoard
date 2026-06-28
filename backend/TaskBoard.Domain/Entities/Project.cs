namespace TaskBoard.Domain.Entities;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Owner { get; set; } = default!;
    public ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
}
