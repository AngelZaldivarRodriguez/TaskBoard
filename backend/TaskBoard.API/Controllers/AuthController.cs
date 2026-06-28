using MediatR;
using Microsoft.AspNetCore.Mvc;
using TaskBoard.Application.Auth.Commands.Register;
using TaskBoard.Application.Auth.Queries.Login;

namespace TaskBoard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new RegisterCommand(request.Email, request.Password, request.Name), ct);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new LoginQuery(request.Email, request.Password), ct);
        return Ok(result);
    }
}

public record RegisterRequest(string Email, string Password, string Name);
public record LoginRequest(string Email, string Password);
