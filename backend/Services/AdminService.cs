using System.Text;
using backend.Auditing;
using backend.Data;
using backend.DTOs;
using backend.DTOs.Requests;
using backend.Exceptions;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class AdminService(AppDbContext db, AuditContext audit, IHubContext<SyncHub> hub) : IAdminService
{
    private static readonly string[] AssignableRoles = ["Employee", "Supervisor", "Personnel"];

    private static (int Page, int PageSize) Normalize(int page, int pageSize) =>
        (Math.Max(page, 1), pageSize < 1 ? 10 : Math.Min(pageSize, 100));

    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    private static string Trunc(string s, int max = 30) => s.Length <= max ? s : s[..max];

    private static string Describe(User u) =>
        $"{u.FirstName} {u.LastName} ({u.Email})";

    private async Task<User> FindTargetAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            throw new KeyNotFoundException("User not found.");

        audit.TargetUserId = user.Id; // only set once we know it exists (FK)
        return user;
    }

    // ----------------------------------------------------------------
    // GET users
    // ----------------------------------------------------------------
    public async Task<GetAllUserResponseDto> GetAllUser(int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);

        var total = await db.Users.CountAsync();

        var users = await db.Users.AsNoTracking()
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AllUsersDto
            {
                UserId = u.Id.ToString(),
                FirstName = u.FirstName,
                MiddleName = u.MiddleName ?? "",
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role,
                RevocationStatus = u.RevocationStatus,
                IsUserBanned = u.RevocationStatus == "Revoked"
            })
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {users.Count} of {total} users";

        return new GetAllUserResponseDto
        {
            Message = "Users retrieved successfully.",
            Users = users,
            TotalUsers = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ----------------------------------------------------------------
    // PATCH access-revocation
    // ----------------------------------------------------------------
    public async Task<UpdateRevocationAccessResponseDto> UpdateRevocationStatus(Guid userId)
    {
        var user = await FindTargetAsync(userId);

        if (user.Role == "Admin")
            throw new BadRequestException("Admin accounts cannot be revoked.");

        var isUserBanned = user.RevocationStatus != "Revoked";

        user.RevocationStatus = isUserBanned ? "Revoked" : "Active";
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Activity = isUserBanned ? "Revoke user access" : "Restore user access";
        audit.Details = $"{(isUserBanned ? "Revoked" : "Restored")} access of {Describe(user)}";

        // Revoked users must not keep working sessions
        if (isUserBanned)
            await ForceLogoutAsync(user.Id, null);

        return new UpdateRevocationAccessResponseDto
        {
            IsUserBanned = isUserBanned,
            Message = isUserBanned
                ? "User access revoked successfully."
                : "User access restored successfully."
        };
    }

    // ----------------------------------------------------------------
    // PATCH role-update
    // ----------------------------------------------------------------
    public async Task<UpdateRoleResponseDto> UpdateRole(Guid userId, UpdateRoleRequestDto request)
    {
        var user = await FindTargetAsync(userId);
        var role = request.Role?.Trim();

        if (string.IsNullOrWhiteSpace(role))
            throw new BadRequestException("Role is required.");

        if (!AssignableRoles.Contains(role))
        {
            audit.Details = $"Attempted to set invalid role '{Trunc(role)}' on {Describe(user)}";
            throw new BadRequestException("Invalid role. Allowed roles: Employee, Supervisor, Personnel.");
        }

        if (user.Role == "Admin")
            throw new BadRequestException("The role of an Admin account cannot be changed.");

        if (user.Role == role)
            throw new BadRequestException($"User already has the role '{role}'.");

        var oldRole = user.Role;
        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Changed role of {Describe(user)} from {oldRole} to {role}";

        return new UpdateRoleResponseDto
        {
            Role = role,
            Message = "User role updated successfully."
        };
    }

    // ----------------------------------------------------------------
    // PATCH password-change
    // ----------------------------------------------------------------
    public async Task<string> ChangePassword(Guid userId, ChangePasswordRequestDto request, Guid actorId, Guid? currentSessionId)
    {
        var user = await FindTargetAsync(userId);
        var password = request.NewPassword;

        // NEVER put the password in audit details / logs
        if (string.IsNullOrEmpty(password))
            throw new BadRequestException("New password is required.");
        if (password.Length < 8)
            throw new BadRequestException("New password must be at least 8 characters long.");
        if (Encoding.UTF8.GetByteCount(password) > 72)
            throw new BadRequestException("New password is too long (maximum 72 bytes).");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 10);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Changed password of {Describe(user)}";

        // Old sessions must not survive a password reset (keep the admin's own current one)
        await ForceLogoutAsync(user.Id, user.Id == actorId ? currentSessionId : null);

        return "User password changed successfully.";
    }

    // ----------------------------------------------------------------
    // GET activity-logs
    // ----------------------------------------------------------------
    public async Task<GetActivityLogsResponseDto> GetActivityLogs(int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);

        var total = await db.ActivityLogs.CountAsync();

        // Most recent first — decided here, frontend must not reorder
        var logs = await db.ActivityLogs.AsNoTracking()
            .OrderByDescending(l => l.Timestamp).ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ActivityLogDto.Projection)
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {logs.Count} of {total} logs";

        return new GetActivityLogsResponseDto
        {
            Message = "Activity logs retrieved successfully.",
            Logs = logs,
            TotalLogs = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ----------------------------------------------------------------
    private async Task ForceLogoutAsync(Guid userId, Guid? exceptSessionId)
    {
        var ids = await db.Sessions
            .Where(s => s.UserId == userId && s.Id != exceptSessionId)
            .Select(s => s.Id)
            .ToListAsync();

        if (ids.Count == 0) return;

        await db.Sessions.Where(s => ids.Contains(s.Id)).ExecuteDeleteAsync();

        await Task.WhenAll(ids.Select(id =>
            hub.Clients.Group($"Session_{id}").SendAsync("LoggedOut")));
        await hub.Clients.Group($"User_{userId}").SendAsync("SessionsUpdated");
    }
}
