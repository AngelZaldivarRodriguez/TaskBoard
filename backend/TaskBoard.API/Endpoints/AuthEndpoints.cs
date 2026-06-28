using MediatR;
using TaskBoard.Application.Auth.Commands.Register;
using TaskBoard.Application.Auth.Queries.Login;

namespace TaskBoard.API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest req, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new RegisterCommand(req.Email, req.Password, req.Name), ct);
            return Results.Ok(result);
        });

        group.MapPost("/login", async (LoginRequest req, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new LoginQuery(req.Email, req.Password), ct);
            return Results.Ok(result);
        });

        return app;
    }
}

public record RegisterRequest(string Email, string Password, string Name);
public record LoginRequest(string Email, string Password);
