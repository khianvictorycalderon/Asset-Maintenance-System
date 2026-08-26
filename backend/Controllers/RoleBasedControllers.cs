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

[ApiController]
[RequireRole("Employee")]
public class EmployeeController : ControllerBase
{
    [HttpGet("api/employee/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for employee!" });
}

[ApiController]
[RequireRole("Supervisor")]
public class SupervisorController : ControllerBase
{
    [HttpGet("api/supervisor/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for supervisor!" });
}

[ApiController]
[RequireRole("Personnel")]
public class PersonnelController : ControllerBase
{
    [HttpGet("api/personnel/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for personnel!" });
}