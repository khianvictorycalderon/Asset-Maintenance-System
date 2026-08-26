using backend.Data;
using backend.DTOs.Responses;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SessionService(AppDbContext db, IHubContext<SyncHub> hub) : ISessionService
{
    private const int PageSize = 10;
    private readonly IHubContext<SyncHub> _hub = hub;

    // ----------------------------------------------------------------
    // GET /api/login-sessions
    // ----------------------------------------------------------------
    public async Task<SessionsListResponse> GetSessionsAsync(Guid userId, Guid? currentSessionId, int page)
    {
        var now = DateTime.UtcNow;

        var query = db.Sessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.ExpiresAt > now);

        var total = await query.CountAsync();

        var offset = (page - 1) * PageSize;

        // Current session first, then by last_seen desc — mirrors the original ORDER BY
        var rows = await query
            .OrderByDescending(s => s.Id == currentSessionId)
            .ThenByDescending(s => s.LastSeen)
            .Skip(offset)
            .Take(PageSize)
            .Select(s => new SessionResponse
            {
                Id        = s.Id,
                Ip        = s.Ip,
                UserAgent = s.UserAgent,
                Browser   = s.Browser,
                Os        = s.Os,
                Device    = s.Device,
                CreatedAt = s.CreatedAt,
                LastSeen  = s.LastSeen,
                ExpiresAt = s.ExpiresAt,
                IsCurrent = s.Id == currentSessionId
            })
            .ToListAsync();

        return new SessionsListResponse
        {
            Sessions = rows,
            Pagination = new PaginationResponse
            {
                Page       = page,
                Limit      = PageSize,
                Total      = total,
                TotalPages = (int)Math.Ceiling((double)total / PageSize)
            }
        };
    }

    // ----------------------------------------------------------------
    // DELETE /api/login-sessions/:id
    // ----------------------------------------------------------------
    public async Task<(bool Success, string? Error, int StatusCode)>
        RevokeSessionAsync(Guid userId, Guid sessionId, Guid? currentSessionId)
    {
        if (sessionId == currentSessionId)
            return (
                false,
                "Cannot revoke your current session. Use logout instead.",
                StatusCodes.Status400BadRequest
            );

        var session = await db.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

        if (session is null)
            return (
                false,
                "Session not found",
                StatusCodes.Status404NotFound
            );

        db.Sessions.Remove(session);
        await db.SaveChangesAsync();

        // Force the revoked session's browser to log out immediately
        await _hub.Clients.Group($"Session_{sessionId}")
            .SendAsync("LoggedOut");

        // Let the rest of the user's open tabs (e.g. the Account page)
        // refresh their session list
        await _hub.Clients.Group($"User_{userId}")
            .SendAsync("SessionsUpdated");

        return (true, null, StatusCodes.Status200OK);
    }

    // ----------------------------------------------------------------
    // DELETE /api/login-sessions  (revoke all others)
    // ----------------------------------------------------------------
    public async Task<(bool Success, string? Error, int StatusCode)>
        RevokeAllOtherSessionsAsync(Guid userId, Guid? currentSessionId)
    {
        var now = DateTime.UtcNow;

        var others = await db.Sessions
            .Where(s => s.UserId == userId
                     && s.Id != currentSessionId
                     && s.ExpiresAt > now)
            .ToListAsync();

        db.Sessions.RemoveRange(others);
        await db.SaveChangesAsync();

        // Force every one of the revoked sessions' browsers to log out immediately
        await Task.WhenAll(
            others.Select(s =>
                _hub.Clients.Group($"Session_{s.Id}")
                    .SendAsync("LoggedOut")
            )
        );

        await _hub.Clients.Group($"User_{userId}")
            .SendAsync("SessionsUpdated");

        return (true, null, StatusCodes.Status200OK);
    }
}
