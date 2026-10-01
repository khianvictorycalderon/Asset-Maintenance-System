using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[ApiController]
[RequireRole("Supervisor")]
public class SupervisorController : ControllerBase
{
    [HttpGet("api/supervisor/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for supervisor!" });
}