using MediatR;
using Microsoft.EntityFrameworkCore;
using TaskBoard.Application.Auth.DTOs;
using TaskBoard.Application.Common.Interfaces;

namespace TaskBoard.Application.Auth.Queries.Login;

public record LoginQuery(string Email, string Password) : IRequest<AuthResponseDto>;

public class LoginQueryHandler(IAppDbContext db, IJwtService jwt, IPasswordHasher hasher)
    : IRequestHandler<LoginQuery, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(LoginQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        return new AuthResponseDto(user.Id, jwt.GenerateToken(user), user.Email, user.Name, user.Role.ToString());
    }
}
