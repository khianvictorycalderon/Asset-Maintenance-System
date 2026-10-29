using backend.Auditing;
using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>Personnel "Maintenance Tasks" page: view the tasks assigned to me and update their status.</summary>
[ApiController]
[RequireRole("Personnel")]
[Route("api/personnel/maintenance-tasks")]
public sealed class PersonnelMaintenanceTasksController(
    IPersonnelMaintenanceTasksService service) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;

    [HttpGet]
    [Audit("Fetch assigned maintenance tasks")]
    public async Task<ActionResult<GetPersonnelMaintenanceTasksResponse>> GetTasks(
        [FromQuery] GetPersonnelMaintenanceTasksQuery query, CancellationToken cancellationToken) =>
        Ok(await service.GetTasksAsync(query, CurrentUserId, cancellationToken));

    [HttpPatch("{taskId:guid}/status")]
    [Audit("Update maintenance task status")]
    public async Task<ActionResult<PersonnelMaintenanceTaskResponse>> UpdateStatus(
        Guid taskId, UpdatePersonnelTaskStatusRequest request, CancellationToken cancellationToken) =>
        Ok(await service.UpdateStatusAsync(taskId, request, CurrentUserId, cancellationToken));
}
