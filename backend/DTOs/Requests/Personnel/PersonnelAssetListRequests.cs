using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Requests.Personnel;

/// <summary>
/// Query parameters for GET api/personnel/asset-list
/// e.g. ?keyword=laptop&amp;category=IT%20Equipment&amp;status=Active&amp;startDate=2026-10-01&amp;endDate=2026-10-31&amp;page=1&amp;pageSize=6
/// </summary>
public sealed class GetPersonnelAssetsQuery : IValidatableObject
{
    // Matches the asset name OR asset tag
    public string? Keyword { get; set; }

    // Exact asset category (omit / empty = all categories)
    public string? Category { get; set; }

    // Exact asset status (omit / empty = all statuses)
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
