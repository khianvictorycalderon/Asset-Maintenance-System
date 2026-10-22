using backend.DTOs;
using backend.DTOs.Requests;

namespace backend.Services;

/// <summary>
/// Employee-side assignment management:
///  - assets   -> supervisor   ("Employee Assets Assignment" page)
///  - personnel -> supervisor  ("Assign Personnel" page)
/// </summary>
public interface IAssignmentService
{
    // ---- shared dropdowns ----
    Task<GetSupervisorOptionsResponseDto> GetSupervisorOptions(bool includeRevoked);

    // ---- asset assignments ----
    Task<GetAssetAssignmentsResponseDto> GetAssetAssignments(GetAssignmentsQueryDto query);
    Task<GetAssetOptionsResponseDto> GetAssetOptions(string? keyword, int limit);
    Task<GetAssignerOptionsResponseDto> GetAssetAssignerOptions();
    Task<AssignAssetsResponseDto> AssignAssets(AssignAssetsRequestDto request, Guid actorId);
    Task<AssetAssignmentResponseDto> UpdateAssetAssignment(Guid assignmentId, UpdateAssignmentRequestDto request, Guid actorId);
    Task<string> DeleteAssetAssignment(Guid assignmentId);

    // ---- personnel assignments ----
    Task<GetPersonnelAssignmentsResponseDto> GetPersonnelAssignments(GetAssignmentsQueryDto query);
    Task<GetPersonnelOptionsResponseDto> GetPersonnelOptions(string? keyword, int limit);
    Task<GetAssignerOptionsResponseDto> GetPersonnelAssignerOptions();
    Task<AssignPersonnelResponseDto> AssignPersonnel(AssignPersonnelRequestDto request, Guid actorId);
    Task<PersonnelAssignmentResponseDto> UpdatePersonnelAssignment(Guid assignmentId, UpdateAssignmentRequestDto request, Guid actorId);
    Task<string> DeletePersonnelAssignment(Guid assignmentId);
}
