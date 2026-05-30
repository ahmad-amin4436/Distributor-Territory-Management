using System.Security.Claims;
using dtms.Data;
using dtms.Models;
using dtms.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace dtms.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokens;

    public AuthController(IUserRepository users, ITokenService tokens)
    {
        _users = users;
        _tokens = tokens;
    }

    /// <summary>Register a new user, returning a session + bearer token.</summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public ActionResult<AuthResponse> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required.");
        if (request.Password.Length < 4)
            return BadRequest("Password must be at least 4 characters.");

        var email = request.Email.Trim().ToLowerInvariant();
        if (_users.GetByEmail(email) is not null)
            return Conflict("An account with this email already exists.");

        var (hash, salt) = PasswordHasher.Hash(request.Password);
        var user = _users.Insert(new User
        {
            Id = $"u-{DateTime.UtcNow.Ticks:x}",
            Email = email,
            Name = string.IsNullOrWhiteSpace(request.Name) ? DeriveName(email) : request.Name!.Trim(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Territory Admin" : request.Role!.Trim(),
            PasswordHash = hash,
            PasswordSalt = salt,
        });

        return Ok(BuildResponse(user));
    }

    /// <summary>Authenticate and receive a session + bearer token.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required.");

        var email = request.Email.Trim().ToLowerInvariant();
        var user = _users.GetByEmail(email);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized("Invalid email or password.");

        _users.TouchLogin(user.Id);
        return Ok(BuildResponse(user));
    }

    /// <summary>Return the current session user from the bearer token.</summary>
    [Authorize]
    [HttpGet("me")]
    public ActionResult<SessionUser> Me()
    {
        var id = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                 ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (id is null) return Unauthorized();

        var user = _users.GetById(id);
        return user is null ? Unauthorized() : Ok(ToSession(user));
    }

    // --- Helpers ---------------------------------------------------------

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresAt) = _tokens.Create(user);
        return new AuthResponse { User = ToSession(user), Token = token, ExpiresAt = expiresAt };
    }

    private static SessionUser ToSession(User u) =>
        new() { Email = u.Email, Name = u.Name, Role = u.Role };

    private static string DeriveName(string email)
    {
        var local = email.Split('@')[0].Replace('.', ' ').Replace('_', ' ').Replace('-', ' ');
        return string.Join(' ', local.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + w[1..]));
    }
}
