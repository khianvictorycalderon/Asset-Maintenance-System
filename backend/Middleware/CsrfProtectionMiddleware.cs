using System.Security.Cryptography;
using System.Text;
using backend.Auditing;

namespace backend.Middleware;

/// <summary>
/// Custom anti-CSRF check. Must run AFTER SessionAuthMiddleware (needs
/// HttpContext.Items["SessionId"] / ["CsrfToken"]).
///
/// The token is never stored anywhere — it's deterministically derived
/// from the session id via HMAC-SHA256(Csrf:TokenKey, sessionId) (see
/// Services/CsrfTokenService.cs), recomputed per-request by
/// SessionAuthMiddleware. It's only ever handed to the client via the
/// /api/login or /api/verify JSON response body. A cross-site request
/// can't read that response, set a custom header, or recompute the
/// token without Csrf:TokenKey, so it can't reproduce a valid
/// X-CSRF-TOKEN.
/// </summary>
public class CsrfProtectionMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-CSRF-TOKEN";

    private static readonly HashSet<string> ProtectedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    // Paths that intentionally run before any session exists — there's
    // no CsrfToken to check against yet. Every other state-changing
    // route requires [RequireAuth] anyway, so this effectively covers
    // every "real" mutation.
    private static readonly HashSet<string> ExemptPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/login", "/api/register"
    };

    public async Task InvokeAsync(HttpContext context)
    {
        var request = context.Request;
        var path = request.Path.Value ?? string.Empty;

        if (!ProtectedMethods.Contains(request.Method)
            || ExemptPaths.Contains(request.Path.Value ?? string.Empty)
            || path.StartsWith("/hubs", StringComparison.OrdinalIgnoreCase)
            )
        {
            await next(context);
            return;
        }

        // No resolved session (not logged in) — let it fall through to
        // whatever [RequireAuth] does further down the pipeline (401),
        // rather than masking that with a 403 here.
        if (context.Items["SessionId"] is null)
        {
            await next(context);
            return;
        }

        var expected = context.Items["CsrfToken"] as string;
        var provided = request.Headers[HeaderName].FirstOrDefault();

        if (!SafeEqual(expected, provided))
        {
            // AMMS: tell the audit log WHY this request was rejected, otherwise
            // AuditMiddleware falls back to the generic "insufficient permission" text.
            context.RequestServices.GetRequiredService<AuditContext>().Details =
                "CSRF validation failed: missing or invalid X-CSRF-TOKEN header";

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("""{"message":"Invalid or missing CSRF token"}""");
            return;
        }

        await next(context);
    }

    // Timing-safe compare. CryptographicOperations.FixedTimeEquals
    // requires equal-length buffers, so mismatched lengths are checked
    // (and short-circuited) first.
    private static bool SafeEqual(string? expected, string? provided)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(provided))
            return false;

        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var providedBytes = Encoding.UTF8.GetBytes(provided);

        return expectedBytes.Length == providedBytes.Length
            && CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }
}

public static class CsrfProtectionMiddlewareExtensions
{
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder app)
        => app.UseMiddleware<CsrfProtectionMiddleware>();
}
