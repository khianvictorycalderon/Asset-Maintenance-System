using backend.Data;
using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AuthService(AppDbContext db, IConfiguration configuration, IHubContext<SyncHub> hub) : IAuthService
{
    private readonly int _sessionDurationHours =
        configuration.GetValue<int>("Session:DurationHours", 6);

    private readonly IHubContext<SyncHub> _hub = hub;

    // ----------------------------------------------------------------
    // Login
    // ----------------------------------------------------------------
    public async Task<(LoginResponse? Response, Guid? SessionId, DateTime? ExpiresAt, string? Error, int StatusCode)>
        LoginAsync(LoginRequest request, string? ip, string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return (null, null, null, "Email and password are required", StatusCodes.Status400BadRequest);

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, null, null, "Invalid username or password", StatusCodes.Status401Unauthorized);

        var expiresAt = DateTime.UtcNow.AddHours(_sessionDurationHours);

        var session = new Session
        {
            UserId    = user.Id,
            Ip        = ip,
            UserAgent = userAgent,
            ExpiresAt = expiresAt
        };

        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        var response = new LoginResponse
        {
            Message = "Login successful",
            User = new UserBasicResponse
            {
                Id        = user.Id,
                Email     = user.Email,
                FirstName = user.FirstName,
                LastName  = user.LastName
            }
        };

        await _hub.Clients.Group($"User_{user.Id}")
            .SendAsync(
                "SessionsUpdated"
            );

        return (response, session.Id, expiresAt, null, StatusCodes.Status200OK);
    }

    // ----------------------------------------------------------------
    // Register
    // ----------------------------------------------------------------
    public async Task<(RegisterResponse? Response, string? Error, int StatusCode)>
        RegisterAsync(RegisterRequest request)
    {
        if (request.Password != request.ConfirmPassword)
            return (null, "Passwords do not match", StatusCodes.Status400BadRequest);

        var exists = await db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            return (null, "Email already exists", StatusCodes.Status409Conflict);

        var hashed = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 10);

        var user = new User
        {
            FirstName    = request.FirstName,
            MiddleName   = string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName,
            LastName     = request.LastName,
            BirthDate    = request.BirthDate,
            Email        = request.Email,
            PasswordHash = hashed,
            Role     = request.Role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var response = new RegisterResponse
        {
            Message = "User created successfully",
            User = new UserBasicResponse
            {
                Id        = user.Id,
                Email     = user.Email,
                FirstName = user.FirstName,
                LastName  = user.LastName
            }
        };

        return (response, null, StatusCodes.Status201Created);
    }

    // ----------------------------------------------------------------
    // Verify
    // ----------------------------------------------------------------
    public async Task<VerifyResponse> VerifyAsync(Guid? sessionId)
    {
        if (sessionId is null)
            return new VerifyResponse { Authenticated = false };

        var now = DateTime.UtcNow;

        var user = await db.Sessions
            .AsNoTracking()
            .Where(s => s.Id == sessionId && s.ExpiresAt > now)
            .Select(s => new
            {
                s.User.Id,
                s.User.Email,
                s.User.Role
            })
            .FirstOrDefaultAsync();

        if (user is null)
            return new VerifyResponse { Authenticated = false };

        var response = new VerifyResponse
        {
            Authenticated = true,
            User = new UserVerifyResponse
            {
                Id    = user.Id,
                Email = user.Email,
                Role  = user.Role
            }
        };

        return response;
    }

    // ----------------------------------------------------------------
    // Logout
    // ----------------------------------------------------------------
    public async Task<bool> LogoutAsync(Guid? sessionId)
    {
        if (sessionId is null)
            return true;

        var session = await db.Sessions.FindAsync(sessionId);

        if (session is null)
            return true;

        var userId = session.UserId;

        await _hub.Clients.Group($"User_{userId}")
            .SendAsync(
                "SessionsUpdated"
            );

        db.Sessions.Remove(session);
        await db.SaveChangesAsync();

        return true;
    }
}
