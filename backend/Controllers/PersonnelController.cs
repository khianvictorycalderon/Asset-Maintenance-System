using backend.Middleware;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[ApiController]
[RequireRole("Personnel")]
public class PersonnelController : ControllerBase
{
    [HttpGet("api/personnel/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for personnel!" });
}