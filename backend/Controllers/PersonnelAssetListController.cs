using backend.Auditing;
using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;
using backend.Middleware;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

/// <summary>
/// Personnel "Asset List" page (read-only): the assets handled by my supervisor.
/// The filter-options endpoint is intentionally NOT audited on success; failures are still logged by the audit middleware.
/// </summary>
[ApiController]
[RequireRole("Personnel")]
[Route("api/personnel/asset-list")]
public sealed class PersonnelAssetListController(
    IPersonnelAssetListService service) : ControllerBase
{
    private Guid CurrentUserId => (Guid)HttpContext.Items["UserId"]!;

    [HttpGet]
    [Audit("Fetch asset list")]
    public async Task<ActionResult<GetPersonnelAssetsResponse>> GetAssets(
        [FromQuery] GetPersonnelAssetsQuery query, CancellationToken cancellationToken) =>
        Ok(await service.GetAssetsAsync(query, CurrentUserId, cancellationToken));

    [HttpGet("filter-options")]
    public async Task<ActionResult<PersonnelAssetFilterOptionsResponse>> GetFilterOptions(
        CancellationToken cancellationToken) =>
        Ok(await service.GetFilterOptionsAsync(CurrentUserId, cancellationToken));
}
