using System.Linq.Expressions;
using backend.Models;

namespace backend.DTOs;

public class AssetDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Tag { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Criticality { get; set; } = string.Empty;
    public DateOnly DateAdded { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Shared by employee asset listing and create/update responses.
    public static readonly Expression<Func<Assets, AssetDto>> Projection = a => new AssetDto
    {
        Id = a.Id,
        Name = a.Name,
        Tag = a.Tag,
        Description = a.Description,
        Status = a.Status,
        Condition = a.Condition,
        Category = a.Category,
        Criticality = a.Criticality,
        DateAdded = a.DateAdded,
        UpdatedAt = a.UpdatedAt
    };

    private static readonly Func<Assets, AssetDto> Compiled = Projection.Compile();

    public static AssetDto From(Assets asset) => Compiled(asset);
}

public class GetAssetsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssetDto> Assets { get; set; } = [];
    public int TotalAssets { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class AssetResponseDto
{
    public string Message { get; set; } = "";
    public AssetDto Asset { get; set; } = new();
}
