using backend.Auditing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Middleware;

internal static class ProblemResults
{
    public static ObjectResult Create(int status, string title, string detail)
    {
        var pd = new ProblemDetails { Status = status, Title = title, Detail = detail };
        pd.Extensions["message"] = detail; // keeps the old { message } shape readable
        return new ObjectResult(pd)
        {
            StatusCode = status,
            ContentTypes = { "application/problem+json" }
        };
    }
}

/// <summary>
/// Enforces an authenticated session. Authorization filter => runs before model binding,
/// so unauthenticated callers can never probe validation behaviour.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAuthAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (context.HttpContext.Items["UserId"] is null)
        {
            context.Result = ProblemResults.Create(
                StatusCodes.Status401Unauthorized, "Unauthorized", "Authentication is required.");
        }
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireRoleAttribute(params string[] allowedRoles) : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (context.HttpContext.Items["UserId"] is null)
        {
            context.Result = ProblemResults.Create(
                StatusCodes.Status401Unauthorized, "Unauthorized", "Authentication is required.");
            return;
        }

        var role = context.HttpContext.Items["Role"] as string;
        if (role is null || !allowedRoles.Contains(role))
        {
            var audit = context.HttpContext.RequestServices.GetRequiredService<AuditContext>();
            audit.Details = $"Forbidden: role '{role ?? "none"}' is not allowed (requires: {string.Join(", ", allowedRoles)})";

            context.Result = ProblemResults.Create(
                StatusCodes.Status403Forbidden, "Forbidden", "You do not have permission to perform this action.");
        }
    }
}
