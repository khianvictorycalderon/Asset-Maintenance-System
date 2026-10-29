using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;

namespace backend.Services;

public interface IPersonnelAssetListService
{
    Task<GetPersonnelAssetsResponse> GetAssetsAsync(
        GetPersonnelAssetsQuery query, Guid personnelId, CancellationToken cancellationToken);

    Task<PersonnelAssetFilterOptionsResponse> GetFilterOptionsAsync(
        Guid personnelId, CancellationToken cancellationToken);
}
