using backend.Auditing;
using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[ApiController]
[RequireRole("Admin")]
public class AdminController(IAdminService _adminService) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;
    private Guid? CurrentSessionId => HttpContext.Items["SessionId"] as Guid?;


    // ==================================================================================================================
    // ==================================================================================================================
    // Test api endpoint
    // ==================================================================================================================
    // ==================================================================================================================
    [HttpGet("api/admin/test")]
    [Audit("Test admin endpoint")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for admin!" });

    // ==================================================================================================================
    // ==================================================================================================================
    // Users and roles
    // ==================================================================================================================
    // ==================================================================================================================
    [HttpGet("api/admin/users")]
    [Audit("Fetch all users")]
    public async Task<IActionResult> GetAllUser(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(await _adminService.GetAllUser(page, pageSize));

    [HttpPatch("api/admin/users/{userId}/access-revocation")]
    [Audit("Revoke / restore user access")]
    public async Task<IActionResult> ToggleAccessRevocation([FromRoute] Guid userId)
        => Ok(await _adminService.UpdateRevocationStatus(userId));

    [HttpPatch("api/admin/users/{userId}/role-update")]
    [Audit("Update user role")]
    public async Task<IActionResult> UpdateRole(
        [FromRoute] Guid userId, [FromBody] UpdateRoleRequestDto request)
        => Ok(await _adminService.UpdateRole(userId, request));

    [HttpPatch("api/admin/users/{userId}/password-change")]
    [Audit("Change user password")]
    public async Task<IActionResult> ChangePassword(
        [FromRoute] Guid userId, [FromBody] ChangePasswordRequestDto request)
    {
        var message = await _adminService.ChangePassword(userId, request, CurrentUserId, CurrentSessionId);
        return Ok(new MessageResponse(message));
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Asset registry
    // ==================================================================================================================
    // ==================================================================================================================
    [HttpGet("api/admin/assets")]
    [Audit("Fetch assets")]
    public async Task<IActionResult> GetAssets([FromQuery] GetAssetsQueryDto query)
        => Ok(await _adminService.GetAssets(query));

    [HttpPost("api/admin/assets")]
    [Audit("Register asset")]
    public async Task<IActionResult> CreateAsset([FromBody] SaveAssetRequestDto request)
        => Ok(await _adminService.CreateAsset(request));

    [HttpPut("api/admin/assets/{assetId}")]
    [Audit("Update asset")]
    public async Task<IActionResult> UpdateAsset(
        [FromRoute] Guid assetId, [FromBody] SaveAssetRequestDto request)
        => Ok(await _adminService.UpdateAsset(assetId, request));

    [HttpDelete("api/admin/assets/{assetId}")]
    [Audit("Delete asset")]
    public async Task<IActionResult> DeleteAsset([FromRoute] Guid assetId)
    {
        var message = await _adminService.DeleteAsset(assetId);
        return Ok(new MessageResponse(message));
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // System activity logs
    // ==================================================================================================================
    // ==================================================================================================================
    [HttpGet("api/admin/activity-logs")]
    [Audit("Fetch activity logs")]
    public async Task<IActionResult> GetActivityLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(await _adminService.GetActivityLogs(page, pageSize));
}
