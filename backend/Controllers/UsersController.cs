using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireAuth]
public class UsersController(IUserService userService) : ControllerBase
{
    private Guid CurrentUserId =>
        (Guid)HttpContext.Items["UserId"]!;

    // ----------------------------------------------------------------
    // GET /api/users/me
    // ----------------------------------------------------------------
    [HttpGet("api/users/me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await userService.GetMeAsync(CurrentUserId);
        if (user is null)
            return NotFound(new { message = "User not found" });

        return Ok(new { user });
    }

    // ----------------------------------------------------------------
    // PATCH /api/users/password
    // ----------------------------------------------------------------
    [HttpPatch("api/users/password")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
    {
        var (success, error, statusCode) = await userService.UpdatePasswordAsync(CurrentUserId, request);

        if (!success)
            return StatusCode(statusCode, new { message = error });

        return Ok(new MessageResponse("Password updated"));
    }

    // ----------------------------------------------------------------
    // PATCH /api/users/{id}
    // ----------------------------------------------------------------
    [HttpPatch("api/users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        if (id != CurrentUserId)
            return Forbid();

        var (success, error, statusCode) = await userService.UpdateProfileAsync(CurrentUserId, request);

        if (!success)
            return StatusCode(statusCode, new { message = error });

        return Ok(new MessageResponse("User updated"));
    }

    // ----------------------------------------------------------------
    // DELETE /api/users/{id}
    // ----------------------------------------------------------------
    [HttpDelete("api/users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, [FromBody] DeleteAccountRequest request)
    {
        if (id != CurrentUserId)
            return Forbid();

        var (success, error, statusCode) = await userService.DeleteAccountAsync(CurrentUserId, request);

        if (!success)
            return StatusCode(statusCode, new { message = error });

        Response.Cookies.Delete("session_id", new CookieOptions
        {
            HttpOnly = true,
            Secure   = true,
            SameSite = SameSiteMode.None,
            Path     = "/"
        });

        return Ok(new MessageResponse("Account deleted"));
    }
}
