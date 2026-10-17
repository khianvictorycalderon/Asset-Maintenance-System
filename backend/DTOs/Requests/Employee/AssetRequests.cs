using System.Text.Json.Serialization;

namespace backend.DTOs.Requests;

public class SaveAssetRequestDto
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("tag")]
    public string? Tag { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    // Optional on create; defaults to Active.
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    // Optional on create; defaults to Good.
    [JsonPropertyName("condition")]
    public string? Condition { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    // Optional on create; defaults to Medium.
    [JsonPropertyName("criticality")]
    public string? Criticality { get; set; }
}

// Query parameters for listing, filtering, and sorting employee-managed assets.
public class GetAssetsQueryDto
{
    public string? Keyword { get; set; }
    // all | name | tag | description | status | condition | category | criticality
    public string? SearchField { get; set; }
    // Inclusive range on date added (yyyy-MM-dd).
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    // name | tag | description | status | condition | category | criticality | dateAdded
    public string? SortField { get; set; }
    // asc | desc
    public string? SortOrder { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
