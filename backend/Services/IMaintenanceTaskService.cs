using backend.DTOs.Requests.Supervisor;
using backend.DTOs.Responses.Supervisor;

namespace backend.Services;

public interface IMaintenanceTaskService
{
    Task<GetMaintenanceTasksResponse> GetTasksAsync(
        GetMaintenanceTasksQuery query, Guid supervisorId, CancellationToken cancellationToken);
    Task<MaintenanceTaskResponse?> GetTaskAsync(
        Guid taskId, Guid supervisorId, CancellationToken cancellationToken);
    Task<GetMaintenanceTaskPersonnelOptionsResponse> GetPersonnelOptionsAsync(
        Guid supervisorId, CancellationToken cancellationToken);
    Task<MaintenanceTaskResponse> SaveTaskAsync(
        Guid? taskId, SaveMaintenanceTaskRequest request, Guid supervisorId, CancellationToken cancellationToken);
    Task DeleteTaskAsync(Guid taskId, Guid supervisorId, CancellationToken cancellationToken);
}
