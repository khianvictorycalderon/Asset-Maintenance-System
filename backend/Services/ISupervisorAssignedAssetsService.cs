using backend.DTOs;
using backend.DTOs.Requests;

namespace backend.Services;

/// <summary>
/// Supervisor-side, read-only view of the assets assigned to the logged-in supervisor
/// ("Assigned Assets" page).
/// </summary>
public interface ISupervisorAssignedAssetsService
{
    Task<GetAssignedAssetsResponseDto> GetAssignedAssets(Guid supervisorId, GetAssignedAssetsQueryDto query);
    Task<AssignedAssetFilterOptionsResponseDto> GetFilterOptions(Guid supervisorId);
}
