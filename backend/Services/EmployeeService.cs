using backend.Auditing;
using backend.Data;
using backend.DTOs;
using backend.DTOs.Requests;
using backend.DTOs.Requests.Employee;
using backend.DTOs.Responses.Employee;
using backend.Exceptions;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Services;

public class EmployeeService(AppDbContext db, AuditContext audit) : IEmployeeService
{
    private static readonly string[] MaintenanceReportStatuses =
        ["Pending", "In Progress", "Completed", "Overdue"];
    private static readonly TimeSpan PhilippineOffset = TimeSpan.FromHours(8);
    private static readonly string[] AssetStatuses = ["Active", "Inactive", "Under Maintenance"];
    private static readonly string[] AssetConditions = ["Good", "Fair", "Poor", "Damaged"];
    private static readonly string[] AssetCategories =
        ["Workshop Equipment", "Office Equipment", "IT Equipment", "Machinery", "Vehicles", "Tools", "Other"];
    private static readonly string[] AssetCriticalities = ["Low", "Medium", "High", "Critical"];
    private static readonly string[] AssetSearchFields =
        ["all", "name", "tag", "description", "status", "condition", "category", "criticality"];
    private static readonly string[] AssetSortFields =
        ["name", "tag", "description", "status", "condition", "category", "criticality", "dateAdded"];

    private static (int Page, int PageSize) Normalize(int page, int pageSize) =>
        (Math.Max(page, 1), pageSize < 1 ? 10 : Math.Min(pageSize, 100));

    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    public async Task<GetAssetsResponseDto> GetAssets(GetAssetsQueryDto query)
    {
        var (page, pageSize) = Normalize(query.Page, query.PageSize);

        var searchField = (query.SearchField ?? "all").Trim();
        if (!AssetSearchFields.Contains(searchField, StringComparer.OrdinalIgnoreCase))
            throw new BadRequestException(
                $"Invalid search field. Allowed values: {string.Join(", ", AssetSearchFields)}.");

        var sortField = (query.SortField ?? "name").Trim();
        if (!AssetSortFields.Contains(sortField, StringComparer.OrdinalIgnoreCase))
            throw new BadRequestException(
                $"Invalid sort field. Allowed values: {string.Join(", ", AssetSortFields)}.");

        var sortOrder = (query.SortOrder ?? "asc").Trim();
        if (!sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase) &&
            !sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Invalid sort order. Allowed values: asc, desc.");

        if (query.StartDate is not null && query.EndDate is not null && query.StartDate > query.EndDate)
            throw new BadRequestException("The start date cannot be later than the end date.");

        var assets = db.Assets.AsNoTracking().AsQueryable();
        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            assets = searchField.ToLowerInvariant() switch
            {
                "name"        => assets.Where(a => EF.Functions.ILike(a.Name, pattern)),
                "tag"         => assets.Where(a => EF.Functions.ILike(a.Tag, pattern)),
                "description" => assets.Where(a => EF.Functions.ILike(a.Description, pattern)),
                "status"      => assets.Where(a => EF.Functions.ILike(a.Status, pattern)),
                "condition"   => assets.Where(a => EF.Functions.ILike(a.Condition, pattern)),
                "category"    => assets.Where(a => EF.Functions.ILike(a.Category, pattern)),
                "criticality" => assets.Where(a => EF.Functions.ILike(a.Criticality, pattern)),
                _ => assets.Where(a =>
                        EF.Functions.ILike(a.Name, pattern) ||
                        EF.Functions.ILike(a.Tag, pattern) ||
                        EF.Functions.ILike(a.Description, pattern) ||
                        EF.Functions.ILike(a.Status, pattern) ||
                        EF.Functions.ILike(a.Condition, pattern) ||
                        EF.Functions.ILike(a.Category, pattern) ||
                        EF.Functions.ILike(a.Criticality, pattern))
            };
        }

        if (query.StartDate is { } start) assets = assets.Where(a => a.DateAdded >= start);
        if (query.EndDate is { } end) assets = assets.Where(a => a.DateAdded <= end);

        var total = await assets.CountAsync();
        var asc = sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<Assets> ordered = sortField.ToLowerInvariant() switch
        {
            "tag"         => asc ? assets.OrderBy(a => a.Tag)         : assets.OrderByDescending(a => a.Tag),
            "description" => asc ? assets.OrderBy(a => a.Description) : assets.OrderByDescending(a => a.Description),
            "status"      => asc ? assets.OrderBy(a => a.Status)      : assets.OrderByDescending(a => a.Status),
            "condition"   => asc ? assets.OrderBy(a => a.Condition)   : assets.OrderByDescending(a => a.Condition),
            "category"    => asc ? assets.OrderBy(a => a.Category)    : assets.OrderByDescending(a => a.Category),
            "criticality" => asc ? assets.OrderBy(a => a.Criticality) : assets.OrderByDescending(a => a.Criticality),
            "dateadded"   => asc ? assets.OrderBy(a => a.DateAdded)   : assets.OrderByDescending(a => a.DateAdded),
            _             => asc ? assets.OrderBy(a => a.Name)        : assets.OrderByDescending(a => a.Name)
        };

        var items = await ordered
            .ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(AssetDto.Projection)
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} assets";

        return new GetAssetsResponseDto
        {
            Message = "Assets retrieved successfully.",
            Assets = items,
            TotalAssets = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    public async Task<GetMaintenanceReportResponse> GetMaintenanceReport(
        GetMaintenanceReportQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);
        if (query.StartDate is { } startDate && query.EndDate is { } endDate && startDate > endDate)
            throw new BadRequestException("The start date cannot be later than the end date.");

        var tasks = db.MaintenanceTasks.AsNoTracking().AsQueryable();
        if (query.StartDate is { } start)
        {
            var startAtUtc = new DateTimeOffset(start.ToDateTime(TimeOnly.MinValue), PhilippineOffset)
                .UtcDateTime;
            tasks = tasks.Where(task => task.CreatedAt >= startAtUtc);
        }

        if (query.EndDate is { } end)
        {
            var endAtUtc = new DateTimeOffset(end.AddDays(1).ToDateTime(TimeOnly.MinValue), PhilippineOffset)
                .UtcDateTime;
            tasks = tasks.Where(task => task.CreatedAt < endAtUtc);
        }

        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            tasks = tasks.Where(task =>
                EF.Functions.ILike(task.Name, pattern) ||
                EF.Functions.ILike(task.Description, pattern) ||
                EF.Functions.ILike(task.Supervisor.FirstName + " " + task.Supervisor.LastName, pattern) ||
                task.Assignees.Any(assignee =>
                    EF.Functions.ILike(
                        assignee.Personnel.FirstName + " " + assignee.Personnel.LastName, pattern)));
        }

        var nowInPhilippines = DateTimeOffset.UtcNow.ToOffset(PhilippineOffset);
        var today = DateOnly.FromDateTime(nowInPhilippines.DateTime);
        var todayStart = new DateTimeOffset(today.ToDateTime(TimeOnly.MinValue), PhilippineOffset)
            .ToUniversalTime();
        if (!string.IsNullOrWhiteSpace(query.Status) &&
            !query.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var status = MaintenanceReportStatuses.FirstOrDefault(value =>
                value.Equals(query.Status.Trim(), StringComparison.OrdinalIgnoreCase))
                ?? throw new BadRequestException("The selected maintenance report status is invalid.");

            tasks = status switch
            {
                "Overdue" => tasks.Where(task => task.Status != "Completed" && task.DueAt < todayStart),
                "Pending" => tasks.Where(task => task.Status == "Pending" && task.DueAt >= todayStart),
                "In Progress" => tasks.Where(task => task.Status == "In Progress" && task.DueAt >= todayStart),
                _ => tasks.Where(task => task.Status == status)
            };
        }

        var total = await tasks.CountAsync(cancellationToken);
        var completed = await tasks.CountAsync(task => task.Status == "Completed", cancellationToken);
        var inProgress = await tasks.CountAsync(
            task => task.Status == "In Progress" && task.DueAt >= todayStart,
            cancellationToken);
        var overdue = await tasks.CountAsync(
            task => task.Status != "Completed" && task.DueAt < todayStart,
            cancellationToken);
        var pending = await tasks.CountAsync(
            task => task.Status == "Pending" && task.DueAt >= todayStart,
            cancellationToken);

        var items = await tasks
            .OrderByDescending(task => task.CreatedAt)
            .ThenBy(task => task.Name)
            .ThenBy(task => task.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(task => task.Supervisor)
            .Include(task => task.Assignees)
                .ThenInclude(assignee => assignee.Personnel)
            .ToListAsync(cancellationToken);

        var reportTasks = items.Select(task =>
        {
            var status = task.Status != "Completed" && task.DueAt < todayStart
                ? "Overdue"
                : task.Status;
            return new MaintenanceReportTaskResponse(
                task.Id,
                task.Name,
                task.Description,
                status,
                task.Assignees
                    .Select(assignee => $"{assignee.Personnel.FirstName} {assignee.Personnel.LastName}")
                    .OrderBy(name => name)
                    .ToList(),
                $"{task.Supervisor.FirstName} {task.Supervisor.LastName}",
                new DateTimeOffset(DateTime.SpecifyKind(task.CreatedAt, DateTimeKind.Utc)),
                task.DueAt,
                new DateTimeOffset(DateTime.SpecifyKind(task.UpdatedAt, DateTimeKind.Utc)));
        }).ToList();

        audit.Details =
            $"Returned maintenance report page {page} (page size {pageSize}), {items.Count} of {total} tasks";
        return new GetMaintenanceReportResponse(
            reportTasks,
            total,
            completed,
            inProgress,
            pending,
            overdue,
            page,
            pageSize,
            TotalPagesOf(total, pageSize));
    }

    public async Task<AssetResponseDto> CreateAsset(SaveAssetRequestDto request)
    {
        var input = ValidateAsset(request);
        await EnsureTagIsUniqueAsync(input.Tag, null);

        var now = DateTime.UtcNow;
        var asset = new Assets
        {
            Name = input.Name,
            Tag = input.Tag,
            Description = input.Description,
            Status = input.Status,
            Condition = input.Condition,
            Category = input.Category,
            Criticality = input.Criticality,
            DateAdded = DateOnly.FromDateTime(now),
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Assets.Add(asset);
        await SaveAssetAsync();
        audit.Details = $"Registered asset {Describe(asset)}";

        return new AssetResponseDto
        {
            Message = "Asset registered successfully.",
            Asset = AssetDto.From(asset)
        };
    }

    public async Task<AssetResponseDto> UpdateAsset(Guid assetId, SaveAssetRequestDto request)
    {
        var asset = await FindAssetAsync(assetId);
        var input = ValidateAsset(request);
        await EnsureTagIsUniqueAsync(input.Tag, asset.Id);

        var changed = new List<string>();
        void Apply(string field, string oldValue, string newValue, Action<string> set)
        {
            if (oldValue == newValue) return;
            set(newValue);
            changed.Add(field);
        }

        var before = Describe(asset);
        Apply("name", asset.Name, input.Name, v => asset.Name = v);
        Apply("tag", asset.Tag, input.Tag, v => asset.Tag = v);
        Apply("description", asset.Description, input.Description, v => asset.Description = v);
        Apply("status", asset.Status, input.Status, v => asset.Status = v);
        Apply("condition", asset.Condition, input.Condition, v => asset.Condition = v);
        Apply("category", asset.Category, input.Category, v => asset.Category = v);
        Apply("criticality", asset.Criticality, input.Criticality, v => asset.Criticality = v);

        if (changed.Count > 0)
        {
            asset.UpdatedAt = DateTime.UtcNow;
            await SaveAssetAsync();
        }

        audit.Details = changed.Count == 0
            ? $"No changes made to asset {before}"
            : $"Updated asset {before} ({string.Join(", ", changed)})";

        return new AssetResponseDto
        {
            Message = "Asset updated successfully.",
            Asset = AssetDto.From(asset)
        };
    }

    public async Task<string> DeleteAsset(Guid assetId)
    {
        var asset = await FindAssetAsync(assetId);
        db.Assets.Remove(asset);
        await db.SaveChangesAsync();
        audit.Details = $"Deleted asset {Describe(asset)}";
        return "Asset deleted successfully.";
    }

    private async Task<Assets> FindAssetAsync(Guid assetId)
    {
        var asset = await db.Assets.FirstOrDefaultAsync(a => a.Id == assetId);
        return asset ?? throw new KeyNotFoundException("Asset not found.");
    }

    private async Task EnsureTagIsUniqueAsync(string tag, Guid? exceptAssetId)
    {
        var lowered = tag.ToLower();
        var exists = await db.Assets.AsNoTracking()
            .AnyAsync(a => a.Tag.ToLower() == lowered && a.Id != exceptAssetId);

        if (exists)
        {
            audit.Details = $"Attempted to use duplicate asset tag '{tag}'";
            throw new BadRequestException("This asset tag already exists. Please use a unique tag.");
        }
    }

    private async Task SaveAssetAsync()
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new BadRequestException("This asset tag already exists. Please use a unique tag.");
        }
    }

    private static AssetInput ValidateAsset(SaveAssetRequestDto request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("Asset name is required.");
        if (name.Length > 100)
            throw new BadRequestException("Asset name must be at most 100 characters long.");

        var tag = request.Tag?.Trim();
        if (string.IsNullOrWhiteSpace(tag))
            throw new BadRequestException("Asset tag is required.");
        if (tag.Length > 50)
            throw new BadRequestException("Asset tag must be at most 50 characters long.");

        var description = request.Description?.Trim() ?? "";
        if (description.Length > 500)
            throw new BadRequestException("Asset description must be at most 500 characters long.");

        return new AssetInput(
            name,
            tag,
            description,
            PickAllowed(request.Status, AssetStatuses, "status", "Active"),
            PickAllowed(request.Condition, AssetConditions, "condition", "Good"),
            PickAllowed(request.Category, AssetCategories, "category", null),
            PickAllowed(request.Criticality, AssetCriticalities, "criticality", "Medium"));
    }

    private static string PickAllowed(string? value, string[] allowed, string label, string? fallback)
    {
        var v = value?.Trim();
        if (string.IsNullOrWhiteSpace(v))
            return fallback ?? throw new BadRequestException($"Asset {label} is required.");

        return allowed.FirstOrDefault(a => a.Equals(v, StringComparison.OrdinalIgnoreCase))
            ?? throw new BadRequestException($"Invalid asset {label}. Allowed values: {string.Join(", ", allowed)}.");
    }

    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private static string Describe(Assets a) => $"{a.Name} ({a.Tag})";

    private sealed record AssetInput(
        string Name, string Tag, string Description,
        string Status, string Condition, string Category, string Criticality);
}
