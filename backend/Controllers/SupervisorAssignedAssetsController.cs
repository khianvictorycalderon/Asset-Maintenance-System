using backend.Auditing;
using backend.DTOs.Requests;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Supervisor "Assigned Assets" page (read-only).
/// The filter-options endpoint is intentionally NOT audited on success; failures are still logged by the audit middleware.
/// </summary>
[ApiController]
[RequireRole("Supervisor")]
public class SupervisorAssignedAssetsController(ISupervisorAssignedAssetsService service) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;

    [HttpGet("api/supervisor/assigned-assets")]
    [Audit("Fetch assigned assets")]
    public async Task<IActionResult> GetAssignedAssets([FromQuery] GetAssignedAssetsQueryDto query)
        => Ok(await service.GetAssignedAssets(CurrentUserId, query));

    [HttpGet("api/supervisor/assigned-assets/filter-options")]
    public async Task<IActionResult> GetFilterOptions()
        => Ok(await service.GetFilterOptions(CurrentUserId));
}
