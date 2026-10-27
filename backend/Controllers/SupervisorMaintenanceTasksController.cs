using backend.Auditing;
using backend.DTOs.Requests.Supervisor;
using backend.DTOs.Responses.Supervisor;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireRole("Supervisor")]
[Route("api/supervisor/maintenance-tasks")]
public sealed class SupervisorMaintenanceTasksController(
    IMaintenanceTaskService maintenanceTaskService) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;

    [HttpGet]
    [Audit("Fetch maintenance tasks")]
    public async Task<ActionResult<GetMaintenanceTasksResponse>> GetTasks(
        [FromQuery] GetMaintenanceTasksQuery query, CancellationToken cancellationToken) =>
        Ok(await maintenanceTaskService.GetTasksAsync(query, CurrentUserId, cancellationToken));

    [HttpGet("personnel-options")]
    public async Task<ActionResult<GetMaintenanceTaskPersonnelOptionsResponse>> GetPersonnelOptions(
        CancellationToken cancellationToken) =>
        Ok(await maintenanceTaskService.GetPersonnelOptionsAsync(CurrentUserId, cancellationToken));

    [HttpGet("{taskId:guid}")]
    public async Task<ActionResult<MaintenanceTaskResponse>> GetTask(
        Guid taskId, CancellationToken cancellationToken)
    {
        var task = await maintenanceTaskService.GetTaskAsync(taskId, CurrentUserId, cancellationToken);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    [Audit("Create maintenance task")]
    public async Task<ActionResult<MaintenanceTaskResponse>> CreateTask(
        SaveMaintenanceTaskRequest request, CancellationToken cancellationToken)
    {
        var task = await maintenanceTaskService.SaveTaskAsync(
            null, request, CurrentUserId, cancellationToken);
        return CreatedAtAction(nameof(GetTask), new { taskId = task.Id }, task);
    }

    [HttpPut("{taskId:guid}")]
    [Audit("Update maintenance task")]
    public async Task<ActionResult<MaintenanceTaskResponse>> UpdateTask(
        Guid taskId, SaveMaintenanceTaskRequest request, CancellationToken cancellationToken)
    {
        var task = await maintenanceTaskService.SaveTaskAsync(
            taskId, request, CurrentUserId, cancellationToken);
        return Ok(task);
    }

    [HttpDelete("{taskId:guid}")]
    [Audit("Delete maintenance task")]
    public async Task<IActionResult> DeleteTask(Guid taskId, CancellationToken cancellationToken)
    {
        await maintenanceTaskService.DeleteTaskAsync(taskId, CurrentUserId, cancellationToken);
        return NoContent();
    }
}
