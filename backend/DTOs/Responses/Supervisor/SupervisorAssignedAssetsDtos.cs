using System.Linq.Expressions;
using backend.Models;

namespace backend.DTOs;

// A row of the Supervisor "Assigned Assets" table
public class AssignedAssetDto
{
    public Guid Id { get; set; }                       // assignment id
    public Guid AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid? AssignedById { get; set; }
    public string? AssignedBy { get; set; }            // null only if that account no longer exists
    public DateOnly DateAssigned { get; set; }

    public static readonly Expression<Func<AssetAssignment, AssignedAssetDto>> Projection = a => new AssignedAssetDto
    {
        Id = a.Id,
        AssetId = a.AssetId,
        AssetName = a.Asset.Name,
        AssetTag = a.Asset.Tag,
        Category = a.Asset.Category,
        AssignedById = a.AssignedById,
        AssignedBy = a.AssignedBy == null ? null : a.AssignedBy.FirstName + " " + a.AssignedBy.LastName,
        DateAssigned = a.DateAssigned
    };
}

public class GetAssignedAssetsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssignedAssetDto> Assets { get; set; } = [];
    public int TotalAssets { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

// Values for the "Asset Category" and "Assigned By" dropdowns (only what this supervisor actually has)
public class AssignedAssetFilterOptionsResponseDto
{
    public string Message { get; set; } = "";
    public List<string> Categories { get; set; } = [];
    public List<AssignerOptionDto> Assigners { get; set; } = [];
}
