using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

public class SampleUserDto
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
};

[ApiController]
// [RequireRole("Admin")]
public class AdminController(IAdminService _adminService) : ControllerBase
{

    [HttpGet("api/admin/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for admin!" });

    [HttpGet("api/admin/users/all")]
    public async Task<IActionResult> GetAllUser
    (
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "createdat",
        [FromQuery] string sortOrder = "desc"
    )
    {
        var result = await _adminService.GetAllUser
        (
            page, pageSize, sortBy, sortOrder
        );

        return Ok(result);
    }

    [HttpPatch("api/admin/users/{userId}/access-revocation")]
    public async Task<IActionResult> ToggleAccessRevocation
    (
        [FromRoute] Guid userId
    )
    {
        var result = await _adminService.UpdateRevocationStatus(userId);

        return Ok(result);
    }
}