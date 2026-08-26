using backend.Data;
using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class UserService(AppDbContext db, IHubContext<SyncHub> hub) : IUserService
{

    private readonly IHubContext<SyncHub> _hub = hub;

    // ----------------------------------------------------------------
    // GET /api/users/me
    // ----------------------------------------------------------------
    public async Task<UserProfileResponse?> GetMeAsync(Guid userId)
    {
        return await db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserProfileResponse
            {
                Id         = u.Id,
                FirstName  = u.FirstName,
                MiddleName = u.MiddleName,
                LastName   = u.LastName,
                BirthDate  = u.BirthDate,
                Email      = u.Email,
                Role       = u.Role,
                CreatedAt  = u.CreatedAt,
                UpdatedAt  = u.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    // ----------------------------------------------------------------
    // PATCH /api/users/:id
    // ----------------------------------------------------------------
    public async Task<(bool Success, string? Error, int StatusCode)>
        UpdateProfileAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(userId);

        if (user is null)
            return (false, "User not found", StatusCodes.Status404NotFound);

        user.FirstName  = request.FirstName;
        user.MiddleName = string.IsNullOrWhiteSpace(request.MiddleName)
            ? null
            : request.MiddleName;

        user.LastName  = request.LastName;
        user.BirthDate = request.BirthDate;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        await _hub.Clients.Group($"User_{userId}")
            .SendAsync("ProfileUpdated");

        return (true, null, StatusCodes.Status200OK);
    }

    // ----------------------------------------------------------------
    // PATCH /api/users/password
    // ----------------------------------------------------------------
    public async Task<(bool Success, string? Error, int StatusCode)>
        UpdatePasswordAsync(Guid userId, UpdatePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return (false, "Passwords do not match", StatusCodes.Status400BadRequest);

        var user = await db.Users.FindAsync(userId);

        if (user is null)
            return (false, "User not found", StatusCodes.Status404NotFound);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return (false, "Invalid current password", StatusCodes.Status401Unauthorized);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(
            request.NewPassword,
            workFactor: 10
        );

        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        // Not needed, since other user's device won't be logged out anyway
        
        // await _hub.Clients.Group($"User_{userId}")
        //     .SendAsync("PasswordChanged");

        return (true, null, StatusCodes.Status200OK);
    }

    // ----------------------------------------------------------------
    // DELETE /api/users/:id
    // ----------------------------------------------------------------
    public async Task<(bool Success, string? Error, int StatusCode)>
        DeleteAccountAsync(Guid userId, DeleteAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Password))
            return (false, "Password is required", StatusCodes.Status400BadRequest);

        var user = await db.Users.FindAsync(userId);

        if (user is null)
            return (false, "User not found", StatusCodes.Status404NotFound);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (false, "Invalid password", StatusCodes.Status401Unauthorized);

        db.Users.Remove(user);
        await db.SaveChangesAsync();

        await _hub.Clients.Group($"User_{userId}")
            .SendAsync("AccountDeleted");

        return (true, null, StatusCodes.Status200OK);
    }
}
