using System.Security.Claims;

namespace TaskBoard.API.Endpoints;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
