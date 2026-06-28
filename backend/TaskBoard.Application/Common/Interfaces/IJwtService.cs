using TaskBoard.Domain.Entities;

namespace TaskBoard.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
