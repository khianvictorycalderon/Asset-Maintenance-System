using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[ApiController]
[RequireRole("Admin")]
public class AdminController : ControllerBase
{
    [HttpGet("api/admin/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for admin!" });
}