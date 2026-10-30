using backend.DTOs;
using backend.DTOs.Requests.Employee;
using backend.DTOs.Requests;
using backend.DTOs.Responses.Employee;

namespace backend.Services;

public interface IEmployeeService
{
    Task<GetAssetsResponseDto> GetAssets(GetAssetsQueryDto query);

    Task<GetMaintenanceReportResponse> GetMaintenanceReport(
        GetMaintenanceReportQuery query, CancellationToken cancellationToken);

    Task<AssetResponseDto> CreateAsset(SaveAssetRequestDto request);

    Task<AssetResponseDto> UpdateAsset(Guid assetId, SaveAssetRequestDto request);

    Task<string> DeleteAsset(Guid assetId);
}
