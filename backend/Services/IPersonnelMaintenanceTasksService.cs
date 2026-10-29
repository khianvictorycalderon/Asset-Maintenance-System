using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;

namespace backend.Services;

public interface IPersonnelMaintenanceTasksService
{
    Task<GetPersonnelMaintenanceTasksResponse> GetTasksAsync(
        GetPersonnelMaintenanceTasksQuery query, Guid personnelId, CancellationToken cancellationToken);

    Task<PersonnelMaintenanceTaskResponse> UpdateStatusAsync(
        Guid taskId, UpdatePersonnelTaskStatusRequest request, Guid personnelId, CancellationToken cancellationToken);
}
