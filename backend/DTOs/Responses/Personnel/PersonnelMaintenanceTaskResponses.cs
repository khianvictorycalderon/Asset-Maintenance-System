namespace backend.DTOs.Responses.Personnel;

/// <summary>A maintenance task as seen by the personnel it is assigned to.</summary>
public sealed record PersonnelMaintenanceTaskResponse(
    Guid Id,
    string Name,
    string Description,
    DateTimeOffset DueAt,
    string Status,
    Guid SupervisorId,
    string Supervisor,
    DateTimeOffset AssignedAt);

/// <summary>Paginated list of the tasks assigned to the current personnel.</summary>
public sealed record GetPersonnelMaintenanceTasksResponse(
    IReadOnlyList<PersonnelMaintenanceTaskResponse> Tasks,
    int TotalTasks,
    int CurrentPage,
    int PageSize,
    int TotalPages);
