namespace backend.DTOs.Responses.Personnel;

/// <summary>An asset as seen by a personnel (the assets handled by their supervisor).</summary>
public sealed record PersonnelAssetResponse(
    Guid Id,                // assignment id
    Guid AssetId,
    string Name,
    string Tag,
    string Category,
    string Status,
    DateOnly DateAssigned);

/// <summary>Paginated list of the assets of the current personnel.</summary>
public sealed record GetPersonnelAssetsResponse(
    IReadOnlyList<PersonnelAssetResponse> Assets,
    int TotalAssets,
    int CurrentPage,
    int PageSize,
    int TotalPages);

/// <summary>Values for the "Category" and "Status" dropdowns (only what this personnel actually has).</summary>
public sealed record PersonnelAssetFilterOptionsResponse(
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> Statuses);
