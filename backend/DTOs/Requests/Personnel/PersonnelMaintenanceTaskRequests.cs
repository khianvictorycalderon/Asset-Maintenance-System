using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Requests.Personnel;

/// <summary>
/// Query parameters for GET api/personnel/maintenance-tasks
/// e.g. ?keyword=compressor&amp;description=filters&amp;status=Pending&amp;startDate=2026-10-01&amp;endDate=2026-10-31&amp;page=1&amp;pageSize=10
/// </summary>
public sealed class GetPersonnelMaintenanceTasksQuery : IValidatableObject
{
    // Matches the task name
    public string? Keyword { get; set; }

    // Matches the task description
    public string? Description { get; set; }

    // Pending | In Progress | Completed (omit / empty / "All" = every status)
    public string? Status { get; set; }

    // "Date assigned" range, inclusive (yyyy-MM-dd)
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate is { } start && EndDate is { } end && start > end)
        {
            yield return new ValidationResult(
                "The start date cannot be later than the end date.",
                [nameof(StartDate), nameof(EndDate)]);
        }
    }
}

/// <summary>Personnel can only change the progress status of a task assigned to them.</summary>
public sealed record UpdatePersonnelTaskStatusRequest
{
    [Required, RegularExpression("Pending|In Progress|Completed")]
    public required string Status { get; init; }
}
