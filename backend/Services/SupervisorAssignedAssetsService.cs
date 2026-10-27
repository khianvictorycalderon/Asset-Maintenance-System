using backend.Data;
using backend.DTOs;
using backend.DTOs.Requests;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SupervisorAssignedAssetsService(AppDbContext db) : ISupervisorAssignedAssetsService
{
    // ----------------------------------------------------------------
    // Table
    // ----------------------------------------------------------------
    public async Task<GetAssignedAssetsResponseDto> GetAssignedAssets(
        Guid supervisorId, GetAssignedAssetsQueryDto query)
    {
        var requestedPage = Math.Max(1, query.Page);
        var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);

        // A supervisor only ever sees their OWN assignments
        var assignments = db.AssetAssignments
            .AsNoTracking()
            .Where(a => a.SupervisorId == supervisorId);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var pattern = $"%{query.Keyword.Trim()}%";
            assignments = assignments.Where(a =>
                EF.Functions.ILike(a.Asset.Name, pattern) ||
                EF.Functions.ILike(a.Asset.Tag, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim();
            assignments = assignments.Where(a => a.Asset.Category == category);
        }

        if (query.AssignedById is Guid assignedById)
            assignments = assignments.Where(a => a.AssignedById == assignedById);

        if (query.StartDate is DateOnly start)
            assignments = assignments.Where(a => a.DateAssigned >= start);

        if (query.EndDate is DateOnly end)
            assignments = assignments.Where(a => a.DateAssigned <= end);

        var total = await assignments.CountAsync();
        var totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));
        var page = Math.Min(requestedPage, totalPages);

        var items = await assignments
            .OrderByDescending(a => a.DateAssigned)
            .ThenBy(a => a.Asset.Name)
            .ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(AssignedAssetDto.Projection)
            .ToListAsync();

        return new GetAssignedAssetsResponseDto
        {
            Message = "Assigned assets fetched successfully",
            Assets = items,
            TotalAssets = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    // ----------------------------------------------------------------
    // Filter dropdowns
    // ----------------------------------------------------------------
    public async Task<AssignedAssetFilterOptionsResponseDto> GetFilterOptions(Guid supervisorId)
    {
        var mine = db.AssetAssignments
            .AsNoTracking()
            .Where(a => a.SupervisorId == supervisorId);

        var categories = await mine
            .Select(a => a.Asset.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        var assigners = await mine
            .Where(a => a.AssignedBy != null)
            .Select(a => new
            {
                a.AssignedBy!.Id,
                a.AssignedBy.FirstName,
                a.AssignedBy.LastName
            })
            .Distinct()
            .ToListAsync();

        return new AssignedAssetFilterOptionsResponseDto
        {
            Message = "Filter options fetched successfully",
            Categories = categories,
            Assigners = assigners
                .Select(u => new AssignerOptionDto { Id = u.Id, FullName = $"{u.FirstName} {u.LastName}" })
                .OrderBy(u => u.FullName)
                .ToList()
        };
    }
}
