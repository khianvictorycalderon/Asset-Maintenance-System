using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireAuth]
public class LoginSessionsController(ISessionService sessionService) : ControllerBase
{
    private Guid CurrentUserId =>
        (Guid)HttpContext.Items["UserId"]!;

    private Guid? CurrentSessionId
    {
        get
        {
            if (HttpContext.Items["SessionId"] is Guid id) return id;
            return null;
        }
    }

    // ----------------------------------------------------------------
    // GET /api/login-sessions
    // ----------------------------------------------------------------
    [HttpGet("api/login-sessions")]
    public async Task<IActionResult> GetSessions([FromQuery] int page = 1)
    {
        var result = await sessionService.GetSessionsAsync(CurrentUserId, CurrentSessionId, page);
        return Ok(result);
    }

    // ----------------------------------------------------------------
    // DELETE /api/login-sessions/{id}  — revoke specific session
    // ----------------------------------------------------------------
    [HttpDelete("api/login-sessions/{id:guid}")]
    public async Task<IActionResult> RevokeSession(Guid id)
    {
        var (success, error, statusCode) =
            await sessionService.RevokeSessionAsync(CurrentUserId, id, CurrentSessionId);

        if (!success)
            return StatusCode(statusCode, new { message = error });

        return Ok(new { message = "Session revoked successfully" });
    }

    // ----------------------------------------------------------------
    // DELETE /api/login-sessions  — revoke ALL other sessions
    // ----------------------------------------------------------------
    [HttpDelete("api/login-sessions")]
    public async Task<IActionResult> RevokeAllOtherSessions()
    {
        var (success, error, statusCode) =
            await sessionService.RevokeAllOtherSessionsAsync(CurrentUserId, CurrentSessionId);

        if (!success)
            return StatusCode(statusCode, new { message = error });

        return Ok(new { message = "All other sessions revoked" });
    }
}
