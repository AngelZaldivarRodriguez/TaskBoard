using MediatR;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Application.Projects.DTOs;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Projects.Commands.CreateProject;

public record CreateProjectCommand(string Name, string? Description, Guid OwnerId) : IRequest<ProjectDto>;

public class CreateProjectCommandHandler(IAppDbContext db) : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            OwnerId = request.OwnerId,
        };

        // Columnas por defecto al crear un proyecto
        project.Columns = new List<BoardColumn>
        {
            new() { Id = Guid.NewGuid(), Name = "Por hacer", Order = 0, ProjectId = project.Id },
            new() { Id = Guid.NewGuid(), Name = "En progreso", Order = 1, ProjectId = project.Id },
            new() { Id = Guid.NewGuid(), Name = "Hecho", Order = 2, ProjectId = project.Id },
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(cancellationToken);

        return new ProjectDto(project.Id, project.Name, project.Description, project.OwnerId, "", 0, project.CreatedAt);
    }
}
