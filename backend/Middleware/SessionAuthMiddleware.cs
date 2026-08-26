using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Middleware;

public class SessionAuthMiddleware(RequestDelegate next)
{
    private const string CookieName = "session_id";

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.Request.Cookies.TryGetValue(CookieName, out var rawId)
            && Guid.TryParse(rawId, out var sessionId))
        {
            var now = DateTime.UtcNow;

            var result = await db.Sessions
                .AsNoTracking()
                .Where(s => s.Id == sessionId && s.ExpiresAt > now)
                .Select(s => new
                {
                    s.UserId,
                    s.User.Email,
                    s.User.Role
                })
                .FirstOrDefaultAsync();

            if (result is not null)
            {
                // Existing custom authentication system
                context.Items["UserId"] = result.UserId;
                context.Items["Email"] = result.Email;
                context.Items["Role"] = result.Role;
                context.Items["SessionId"] = sessionId;

                // SignalR / HttpContext.User authentication
                var claims = new List<Claim>
                {
                    new Claim(
                        "UserId",
                        result.UserId.ToString()
                    ),

                    new Claim(
                        "SessionId",
                        sessionId.ToString()
                    ),

                    new Claim(
                        ClaimTypes.Email,
                        result.Email
                    ),

                    new Claim(
                        ClaimTypes.Role,
                        result.Role
                    )
                };

                var identity = new ClaimsIdentity(
                    claims,
                    "SessionAuth"
                );

                context.User = new ClaimsPrincipal(identity);
            }
        }

        await next(context);
    }
}

public static class SessionAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionAuth(
        this IApplicationBuilder app
    )
        => app.UseMiddleware<SessionAuthMiddleware>();
}