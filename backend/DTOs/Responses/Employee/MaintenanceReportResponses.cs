namespace backend.DTOs.Responses.Employee;

/// <summary>A maintenance task row in the employee report.</summary>
public sealed record MaintenanceReportTaskResponse(
    Guid Id,
    string Name,
    string Description,
    string Status,
    IReadOnlyList<string> PersonnelNames,
    string SupervisorName,
    DateTimeOffset AssignedAt,
    DateTimeOffset DueAt,
    DateTimeOffset UpdatedAt);

/// <summary>Paginated maintenance report rows and status totals.</summary>
public sealed record GetMaintenanceReportResponse(
    IReadOnlyList<MaintenanceReportTaskResponse> Tasks,
    int TotalTasks,
    int CompletedTasks,
    int InProgressTasks,
    int PendingTasks,
    int OverdueTasks,
    int CurrentPage,
    int PageSize,
    int TotalPages);
