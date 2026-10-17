using backend.DTOs;
using backend.DTOs.Requests;

namespace backend.Services;

public interface IEmployeeService
{
    Task<GetAssetsResponseDto> GetAssets(GetAssetsQueryDto query);

    Task<AssetResponseDto> CreateAsset(SaveAssetRequestDto request);

    Task<AssetResponseDto> UpdateAsset(Guid assetId, SaveAssetRequestDto request);

    Task<string> DeleteAsset(Guid assetId);
}
