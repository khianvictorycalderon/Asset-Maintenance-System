using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Requests;

// Query parameters for GET api/supervisor/assigned-assets
// e.g. ?keyword=cnc&category=Machinery&assignedById=...&startDate=2026-10-01&endDate=2026-10-31&page=1&pageSize=5
public class GetAssignedAssetsQueryDto : IValidatableObject
{
    // Matches asset name OR asset tag
    public string? Keyword { get; set; }

    // Exact asset category (omit / empty = all categories)
    public string? Category { get; set; }

    // The Employee/Admin who made the assignment (omit = all)
    public Guid? AssignedById { get; set; }

    // "Date assigned" range, inclusive (yyyy-MM-dd)
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StartDate is DateOnly start && EndDate is DateOnly end && start > end)
        {
            yield return new ValidationResult(
                "The start date cannot be later than the end date.",
                new[] { nameof(StartDate), nameof(EndDate) });
        }
    }
}
