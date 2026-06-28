using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Auth.DTOs;
using TaskBoard.Application.Common.Interfaces;
using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Auth.Commands.Register;

public record RegisterCommand(string Email, string Password, string Name) : IRequest<AuthResponseDto>;

public class RegisterCommandHandler(IAppDbContext db, IJwtService jwt, IPasswordHasher hasher)
    : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            throw new InvalidOperationException("El email ya está registrado.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            PasswordHash = hasher.Hash(request.Password),
            Role = UserRole.Member
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(user.Id, jwt.GenerateToken(user), user.Email, user.Name, user.Role.ToString());
    }
}
