using backend.Auditing;
using backend.DTOs.Requests;
using backend.DTOs.Requests.Employee;
using backend.DTOs.Responses;
using backend.DTOs.Responses.Employee;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireRole("Employee")]
public class EmployeeController(IEmployeeService employeeService) : ControllerBase
{
    [HttpGet("api/employee/test")]
    public IActionResult Test() =>
        Ok(new { message = "You are authorized for employee!" });

    [HttpGet("api/employee/assets")]
    [Audit("Fetch assets")]
    public async Task<IActionResult> GetAssets([FromQuery] GetAssetsQueryDto query)
        => Ok(await employeeService.GetAssets(query));

    /// <summary>Returns a filtered and paginated maintenance report for employees.</summary>
    [HttpGet("api/employee/maintenance-report")]
    [Audit("Fetch employee maintenance report")]
    [ProducesResponseType(typeof(GetMaintenanceReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMaintenanceReport(
        [FromQuery] GetMaintenanceReportQuery query, CancellationToken cancellationToken)
        => Ok(await employeeService.GetMaintenanceReport(query, cancellationToken));

    [HttpPost("api/employee/assets")]
    [Audit("Register asset")]
    public async Task<IActionResult> CreateAsset([FromBody] SaveAssetRequestDto request)
        => Ok(await employeeService.CreateAsset(request));

    [HttpPut("api/employee/assets/{assetId}")]
    [Audit("Update asset")]
    public async Task<IActionResult> UpdateAsset(
        [FromRoute] Guid assetId, [FromBody] SaveAssetRequestDto request)
        => Ok(await employeeService.UpdateAsset(assetId, request));

    [HttpDelete("api/employee/assets/{assetId}")]
    [Audit("Delete asset")]
    public async Task<IActionResult> DeleteAsset([FromRoute] Guid assetId)
    {
        var message = await employeeService.DeleteAsset(assetId);
        return Ok(new MessageResponse(message));
    }
}