namespace backend.DTOs.Responses.Supervisor;

/// <summary>Personnel member assigned to a maintenance task.</summary>
public sealed record MaintenanceTaskAssigneeResponse(Guid Id, string FullName);

/// <summary>A maintenance task returned to its supervisor.</summary>
public sealed record MaintenanceTaskResponse(
    Guid Id,
    string Name,
    string Description,
    DateTimeOffset DueAt,
    string Status,
    Guid? AssignedById,
    string? AssignedBy,
    IReadOnlyList<MaintenanceTaskAssigneeResponse> Assignees,
    DateTimeOffset CreatedAt);

/// <summary>Paginated maintenance tasks returned to a supervisor.</summary>
public sealed record GetMaintenanceTasksResponse(
    IReadOnlyList<MaintenanceTaskResponse> Tasks,
    int TotalTasks,
    int CurrentPage,
    int PageSize,
    int TotalPages);

/// <summary>A personnel member available to the supervisor for task assignment.</summary>
public sealed record MaintenanceTaskPersonnelOption(Guid Id, string FullName, string Email);

/// <summary>Personnel options available to the supervisor.</summary>
public sealed record GetMaintenanceTaskPersonnelOptionsResponse(
    IReadOnlyList<MaintenanceTaskPersonnelOption> Personnel);
