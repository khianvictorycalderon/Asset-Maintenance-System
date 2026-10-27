using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Requests.Supervisor;

/// <summary>Payload for creating or updating a supervisor maintenance task.</summary>
public sealed record SaveMaintenanceTaskRequest
{
    [Required, MaxLength(100)]
    public required string Name { get; init; }

    [Required, MaxLength(100)]
    public required string Description { get; init; }

    [Required]
    public DateTimeOffset DueAt { get; init; }

    [Required]
    public required List<Guid> PersonnelIds { get; init; }

    [Required, RegularExpression("Pending|In Progress|Completed")]
    public required string Status { get; init; }
}

/// <summary>Filters and pagination for the supervisor maintenance-task list.</summary>
public sealed class GetMaintenanceTasksQuery
{
    public string? Keyword { get; set; }
    public string? Status { get; set; }
    public Guid? PersonnelId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}
