using backend.Auditing;
using backend.DTOs.Requests;
using backend.DTOs.Responses;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// "Employee Assets Assignment" and "Assign Personnel" pages.
/// Dropdown/option endpoints are intentionally NOT audited on success (they fire while typing);
/// failures are still logged by the audit middleware.
/// </summary>
[ApiController]
[RequireRole("Employee")]
public class EmployeeAssignmentController(IAssignmentService assignmentService) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;

    // ==================================================================================================================
    // Shared dropdown: supervisors
    // ==================================================================================================================
    // includeRevoked=true is meant for the table's "Supervisor" FILTER (old assignments may point to a revoked supervisor).
    // The assign form / Edit modal should call it without the flag so revoked supervisors cannot be picked.
    [HttpGet("api/employee/supervisors")]
    public async Task<IActionResult> GetSupervisors([FromQuery] bool includeRevoked = false)
        => Ok(await assignmentService.GetSupervisorOptions(includeRevoked));

    // ==================================================================================================================
    // Asset assignments
    // ==================================================================================================================
    [HttpGet("api/employee/asset-assignments")]
    [Audit("Fetch asset assignments")]
    public async Task<IActionResult> GetAssetAssignments([FromQuery] GetAssignmentsQueryDto query)
        => Ok(await assignmentService.GetAssetAssignments(query));

    [HttpGet("api/employee/asset-assignments/asset-options")]
    public async Task<IActionResult> GetAssetOptions([FromQuery] string? keyword, [FromQuery] int limit = 100)
        => Ok(await assignmentService.GetAssetOptions(keyword, limit));

    [HttpGet("api/employee/asset-assignments/assigner-options")]
    public async Task<IActionResult> GetAssetAssignerOptions()
        => Ok(await assignmentService.GetAssetAssignerOptions());

    [HttpPost("api/employee/asset-assignments")]
    [Audit("Assign assets")]
    public async Task<IActionResult> AssignAssets([FromBody] AssignAssetsRequestDto request)
        => Ok(await assignmentService.AssignAssets(request, CurrentUserId));

    [HttpPut("api/employee/asset-assignments/{assignmentId:guid}")]
    [Audit("Update asset assignment")]
    public async Task<IActionResult> UpdateAssetAssignment(
        [FromRoute] Guid assignmentId, [FromBody] UpdateAssignmentRequestDto request)
        => Ok(await assignmentService.UpdateAssetAssignment(assignmentId, request, CurrentUserId));

    [HttpDelete("api/employee/asset-assignments/{assignmentId:guid}")]
    [Audit("Delete asset assignment")]
    public async Task<IActionResult> DeleteAssetAssignment([FromRoute] Guid assignmentId)
    {
        var message = await assignmentService.DeleteAssetAssignment(assignmentId);
        return Ok(new MessageResponse(message));
    }

    // ==================================================================================================================
    // Personnel assignments
    // ==================================================================================================================
    [HttpGet("api/employee/personnel-assignments")]
    [Audit("Fetch personnel assignments")]
    public async Task<IActionResult> GetPersonnelAssignments([FromQuery] GetAssignmentsQueryDto query)
        => Ok(await assignmentService.GetPersonnelAssignments(query));

    [HttpGet("api/employee/personnel-assignments/personnel-options")]
    public async Task<IActionResult> GetPersonnelOptions([FromQuery] string? keyword, [FromQuery] int limit = 100)
        => Ok(await assignmentService.GetPersonnelOptions(keyword, limit));

    [HttpGet("api/employee/personnel-assignments/assigner-options")]
    public async Task<IActionResult> GetPersonnelAssignerOptions()
        => Ok(await assignmentService.GetPersonnelAssignerOptions());

    [HttpPost("api/employee/personnel-assignments")]
    [Audit("Assign personnel")]
    public async Task<IActionResult> AssignPersonnel([FromBody] AssignPersonnelRequestDto request)
        => Ok(await assignmentService.AssignPersonnel(request, CurrentUserId));

    [HttpPut("api/employee/personnel-assignments/{assignmentId:guid}")]
    [Audit("Update personnel assignment")]
    public async Task<IActionResult> UpdatePersonnelAssignment(
        [FromRoute] Guid assignmentId, [FromBody] UpdateAssignmentRequestDto request)
        => Ok(await assignmentService.UpdatePersonnelAssignment(assignmentId, request, CurrentUserId));

    [HttpDelete("api/employee/personnel-assignments/{assignmentId:guid}")]
    [Audit("Delete personnel assignment")]
    public async Task<IActionResult> DeletePersonnelAssignment([FromRoute] Guid assignmentId)
    {
        var message = await assignmentService.DeletePersonnelAssignment(assignmentId);
        return Ok(new MessageResponse(message));
    }
}
