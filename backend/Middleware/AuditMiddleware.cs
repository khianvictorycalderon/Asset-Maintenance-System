using backend.Auditing;
using backend.Services;
using Microsoft.AspNetCore.Routing;

namespace backend.Middleware;

/// <summary>
/// Audits every request that hits an endpoint:
///  - authenticated actor  -> logs the User ID (no IP)
///  - no valid session (curl, forced requests, expired session...) -> logs the IP address
/// Runs AFTER the endpoint finished, so it knows the real outcome (status code).
/// Must be registered before UseExceptionHandler and UseSessionAuth.
/// </summary>
public class AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, IActivityLogService activityLogs, AuditContext audit)
    {
        await next(context);

        try
        {
            await WriteAuditAsync(context, activityLogs, audit);
        }
        catch (Exception ex)
        {
            // Auditing must never break the actual request.
            logger.LogError(ex, "Failed to write activity log");
        }
    }

    private static async Task WriteAuditAsync(HttpContext context, IActivityLogService activityLogs, AuditContext audit)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<NoAuditAttribute>() is not null) return;

        var attr = endpoint?.Metadata.GetMetadata<AuditAttribute>();
        var status = context.Response.StatusCode;
        var success = status is >= 200 and < 300;

        // Unannotated endpoints: only log failures. Unknown routes: only under /api.
        if (attr is null)
        {
            if (status < 400) return;
            if (endpoint is null && !context.Request.Path.StartsWithSegments("/api")) return;
        }

        Guid? actorId = context.Items["UserId"] is Guid id ? id : null;

        var route = (endpoint as RouteEndpoint)?.RoutePattern.RawText ?? context.Request.Path.Value;
        var activity = audit.Activity ?? attr?.Activity ?? $"{context.Request.Method} {route}";

        var result = success ? "Success"
            : status is 400 or 409 or 422 ? "Rejected"
            : "Failed";

        // ---- details (as descriptive as possible) ----
        var parts = new List<string>();
        var details = audit.Details ?? (success ? null : DefaultDetails(status));
        if (details is not null) parts.Add(details);

        if (!success && audit.TargetUserId is null
            && context.Request.RouteValues.TryGetValue("userId", out var rawTarget))
            parts.Add($"Target user id: {rawTarget}");

        string? ip = null;
        if (actorId is null)
        {
            ip = GetClientIp(context);
            var ua = context.Request.Headers.UserAgent.ToString();
            parts.Add($"User-Agent: {(string.IsNullOrWhiteSpace(ua) ? "none" : ua)}");
        }

        // Successful GETs are not pushed in real time (avoids refetch loops / noise).
        var broadcast = !(success && HttpMethods.IsGet(context.Request.Method));

        await activityLogs.RecordAsync(
            activity: Clean(activity, 100)!,
            result: result,
            performedById: actorId,
            ipAddress: Clean(ip, 45),
            targetUserId: audit.TargetUserId,
            details: parts.Count == 0 ? null : Clean(string.Join(" | ", parts), 500),
            broadcast: broadcast);
    }

    private static string DefaultDetails(int status) => status switch
    {
        401 => "Unauthenticated request (no valid session)",
        403 => "Forbidden: insufficient permission",
        404 => "Resource not found",
        400 => "Invalid request",
        409 => "Conflict: the operation could not be completed",
        >= 500 => "Unexpected server error",
        _ => $"Request ended with HTTP {status}"
    };

    // Same approach as AuthController so IPs are consistent across the app.
    private static string? GetClientIp(HttpContext context) =>
        context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim()
        ?? context.Connection.RemoteIpAddress?.ToString();

    // Strips control chars (log injection) and trims to the column size.
    private static string? Clean(string? value, int max)
    {
        if (value is null) return null;
        var cleaned = new string(value.Where(c => !char.IsControl(c)).ToArray());
        return cleaned.Length <= max ? cleaned : cleaned[..max];
    }
}

public static class AuditMiddlewareExtensions
{
    public static IApplicationBuilder UseAudit(this IApplicationBuilder app)
        => app.UseMiddleware<AuditMiddleware>();
}
