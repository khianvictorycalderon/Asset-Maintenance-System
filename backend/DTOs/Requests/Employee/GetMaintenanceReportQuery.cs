namespace backend.DTOs.Requests.Employee;

/// <summary>Filters and pagination for the employee maintenance report.</summary>
public sealed class GetMaintenanceReportQuery
{
    /// <summary>Matches task name, description, supervisor, or assigned personnel.</summary>
    public string? Keyword { get; set; }

    /// <summary>Pending, In Progress, Completed, or Overdue; omit to include every status.</summary>
    public string? Status { get; set; }

    /// <summary>Inclusive start date for when the task was created.</summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>Inclusive end date for when the task was created.</summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>One-based page number.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Number of report rows per page.</summary>
    public int PageSize { get; set; } = 10;
}
