using backend.DTOs.Responses;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireRole("Admin", "Employee", "Supervisor", "Personnel")]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<DashboardResponse>> GetDashboard(CancellationToken cancellationToken)
    {
        var userId = (Guid)HttpContext.Items["UserId"]!;
        var role = (string)HttpContext.Items["Role"]!;
        return Ok(await dashboardService.GetDashboardAsync(userId, role, cancellationToken));
    }
}
