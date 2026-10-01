using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[ApiController]
[RequireRole("Employee")]
public class EmployeeController : ControllerBase
{
    [HttpGet("api/employee/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for employee!" });
}