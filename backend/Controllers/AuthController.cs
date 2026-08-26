using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    private const string CookieName = "session_id";

    // ----------------------------------------------------------------
    // POST /api/login
    // ----------------------------------------------------------------
    [HttpPost("api/login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0]
                 ?? HttpContext.Connection.RemoteIpAddress?.ToString();

        var userAgent = Request.Headers.UserAgent.ToString();

        var (response, sessionId, expiresAt, error, statusCode) =
            await authService.LoginAsync(request, ip, userAgent);

        if (error is not null)
            return StatusCode(statusCode, new { message = error });

        Response.Cookies.Append(CookieName, sessionId!.Value.ToString(), new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.None,
            Expires  = expiresAt,
            Path     = "/"
        });

        return Ok(response);
    }

    // ----------------------------------------------------------------
    // POST /api/register
    // ----------------------------------------------------------------
    [HttpPost("api/register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (response, error, statusCode) = await authService.RegisterAsync(request);

        if (error is not null)
            return StatusCode(statusCode, new { message = error });

        return StatusCode(StatusCodes.Status201Created, response);
    }

    // ----------------------------------------------------------------
    // GET /api/verify
    // ----------------------------------------------------------------
    [HttpGet("api/verify")]
    public async Task<IActionResult> Verify()
    {
        Guid? sessionId = null;
        if (Request.Cookies.TryGetValue(CookieName, out var raw) && Guid.TryParse(raw, out var id))
            sessionId = id;

        var result = await authService.VerifyAsync(sessionId);
        return Ok(result);
    }

    // ----------------------------------------------------------------
    // DELETE /api/logout
    // ----------------------------------------------------------------
    [HttpDelete("api/logout")]
    public async Task<IActionResult> Logout()
    {
        Guid? sessionId = null;
        if (Request.Cookies.TryGetValue(CookieName, out var raw) && Guid.TryParse(raw, out var id))
            sessionId = id;

        Response.Cookies.Delete(CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.None,
            Path     = "/"
        });

        await authService.LogoutAsync(sessionId);
        return Ok(new { success = true });
    }
}
