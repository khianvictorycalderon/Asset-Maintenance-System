using System.Text.Json.Serialization;

namespace backend.DTOs.Requests;

public class UpdateRoleRequestDto
{
    [JsonPropertyName("role")]
    public string? Role { get; set; }
}

public class ChangePasswordRequestDto
{
    // confirm_password is frontend-only and intentionally NOT part of this DTO
    [JsonPropertyName("new_password")]
    public string? NewPassword { get; set; }
}

// Used for both registering (POST) and updating (PUT) an asset
public class SaveAssetRequestDto
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("tag")]
    public string? Tag { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    // Optional on create: defaults to Active
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    // Optional on create: defaults to Good
    [JsonPropertyName("condition")]
    public string? Condition { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    // Optional on create: defaults to Medium
    [JsonPropertyName("criticality")]
    public string? Criticality { get; set; }
}

// Query string for GET api/admin/assets (bound with [FromQuery]; keys are case-insensitive)
// e.g. ?keyword=laptop&searchField=name&startDate=2026-04-01&endDate=2026-04-30&sortField=tag&sortOrder=desc&page=1&pageSize=5
public class GetAssetsQueryDto
{
    public string? Keyword { get; set; }
    // all | name | tag | description | status | condition | category | criticality
    public string? SearchField { get; set; }
    // Inclusive range on date added (yyyy-MM-dd)
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    // name | tag | description | status | condition | category | criticality | dateAdded
    public string? SortField { get; set; }
    // asc | desc
    public string? SortOrder { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
