using backend.Auditing;
using backend.Data;
using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;
using backend.Exceptions;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class PersonnelAssetListService(
    AppDbContext db, AuditContext audit) : IPersonnelAssetListService
{
    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    // The assets of a personnel = the assets assigned to their supervisor.
    // (A personnel has at most ONE supervisor; no supervisor => empty list.)
    private IQueryable<AssetAssignment> MyAssets(Guid personnelId)
    {
        var supervisorIds = db.PersonnelAssignments
            .Where(p => p.PersonnelId == personnelId)
            .Select(p => p.SupervisorId);

        return db.AssetAssignments
            .AsNoTracking()
            .Where(a => supervisorIds.Contains(a.SupervisorId));
    }

    public async Task<GetPersonnelAssetsResponse> GetAssetsAsync(
        GetPersonnelAssetsQuery query, Guid personnelId, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);

        if (query.StartDate is not null && query.EndDate is not null && query.StartDate > query.EndDate)
            throw new BadRequestException("The start date cannot be later than the end date.");

        var assets = MyAssets(personnelId);

        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            assets = assets.Where(a =>
                EF.Functions.ILike(a.Asset.Name, pattern) ||
                EF.Functions.ILike(a.Asset.Tag, pattern));
        }

        var category = query.Category?.Trim();
        if (!string.IsNullOrEmpty(category))
            assets = assets.Where(a => a.Asset.Category == category);

        var status = query.Status?.Trim();
        if (!string.IsNullOrEmpty(status))
            assets = assets.Where(a => a.Asset.Status == status);

        if (query.StartDate is { } start)
            assets = assets.Where(a => a.DateAssigned >= start);

        if (query.EndDate is { } end)
            assets = assets.Where(a => a.DateAssigned <= end);

        var total = await assets.CountAsync(cancellationToken);

        var items = await assets
            .OrderByDescending(a => a.DateAssigned)
            .ThenBy(a => a.Asset.Name)
            .ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new PersonnelAssetResponse(
                a.Id,
                a.AssetId,
                a.Asset.Name,
                a.Asset.Tag,
                a.Asset.Category,
                a.Asset.Status,
                a.DateAssigned))
            .ToListAsync(cancellationToken);

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} assets";

        return new GetPersonnelAssetsResponse(items, total, page, pageSize, TotalPagesOf(total, pageSize));
    }

    public async Task<PersonnelAssetFilterOptionsResponse> GetFilterOptionsAsync(
        Guid personnelId, CancellationToken cancellationToken)
    {
        var mine = MyAssets(personnelId);

        var categories = await mine
            .Select(a => a.Asset.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(cancellationToken);

        var statuses = await mine
            .Select(a => a.Asset.Status)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(cancellationToken);

        return new PersonnelAssetFilterOptionsResponse(categories, statuses);
    }
}
