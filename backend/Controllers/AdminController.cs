using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

public class SampleUserDto
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
};

[ApiController]
[RequireRole("Admin")]
public class AdminController(IAdminService adminService) : ControllerBase
{

    [HttpGet("api/admin/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for admin!" });

    [HttpGet("api/admin/users/all")]
    public async Task<IActionResult> GetAllUser(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "createdat",
        [FromQuery] string sortOrder = "desc"
    )
    {
        var result = await adminService.GetAllUser(
            page, pageSize, sortBy, sortOrder
        );

        return Ok(result);
    }
}