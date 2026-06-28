using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<BoardColumn> Columns => Set<BoardColumn>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectMember>()
            .HasKey(pm => new { pm.ProjectId, pm.UserId });

        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.Project).WithMany(p => p.Members).HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.User).WithMany(u => u.ProjectMemberships).HasForeignKey(pm => pm.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.Assignee).WithMany().HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Proyecto -> Owner: si se borra el owner no se borran los proyectos automáticamente
        modelBuilder.Entity<Project>()
            .HasOne(p => p.Owner).WithMany(u => u.OwnedProjects).HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // ActivityLog -> User: Restrict para evitar cascadas múltiples
        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ActivityLog -> Task: si se borra la tarea, se borran sus logs
        modelBuilder.Entity<ActivityLog>()
            .HasOne(a => a.Task).WithMany(t => t.ActivityLogs).HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<ProjectMember>().Property(pm => pm.Role).HasConversion<string>();
        modelBuilder.Entity<TaskItem>().Property(t => t.Priority).HasConversion<string>();
    }
}
