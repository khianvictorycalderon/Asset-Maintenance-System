using backend.Auditing;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Exceptions;

public class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception ex, CancellationToken ct)
    {
        var (status, title, detail) = ex switch
        {
            BadRequestException   => (StatusCodes.Status400BadRequest, "Bad Request", ex.Message),
            KeyNotFoundException  => (StatusCodes.Status404NotFound, "Not Found", ex.Message),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Conflict",
                "The record was modified or removed by someone else. Please refresh and try again."),
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error",
                "An unexpected error occurred.")
        };

        if (status >= 500) logger.LogError(ex, "Unhandled exception");

        // Let the audit log know WHY (only for safe, expected 4xx messages).
        if (status < 500)
        {
            var audit = context.RequestServices.GetRequiredService<AuditContext>();
            audit.Details ??= detail;
        }

        var pd = new ProblemDetails { Status = status, Title = title, Detail = detail };
        pd.Extensions["message"] = detail; // convenience / backward compat with existing { message } responses

        context.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = pd,
            Exception = ex
        });
    }
}
