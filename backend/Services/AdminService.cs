using System.Text;
using backend.Auditing;
using backend.Data;
using backend.DTOs;
using backend.DTOs.Requests;
using backend.Exceptions;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Npgsql;

public class AdminService(AppDbContext db, AuditContext audit, IHubContext<SyncHub> hub) : IAdminService
{

    // ----------------------------------------------------------------
    // Static variables
    // ----------------------------------------------------------------
    private static readonly string[] AssignableRoles = ["Employee", "Supervisor", "Personnel"];

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

    private static string Trunc(string s, int max = 30) => s.Length <= max ? s : s[..max];

    private static string Describe(User u) =>
        $"{u.FirstName} {u.LastName} ({u.Email})";

    private async Task<User> FindTargetAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            throw new KeyNotFoundException("User not found.");

        audit.TargetUserId = user.Id; // only set once we know it exists (FK)
        return user;
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Users and roles
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // GET users
    // ----------------------------------------------------------------
    public async Task<GetAllUserResponseDto> GetAllUser(int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);

        var total = await db.Users.CountAsync();

        var users = await db.Users.AsNoTracking()
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AllUsersDto
            {
                UserId = u.Id.ToString(),
                FirstName = u.FirstName,
                MiddleName = u.MiddleName ?? "",
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role,
                RevocationStatus = u.RevocationStatus,
                IsUserBanned = u.RevocationStatus == "Revoked"
            })
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {users.Count} of {total} users";

        return new GetAllUserResponseDto
        {
            Message = "Users retrieved successfully.",
            Users = users,
            TotalUsers = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ----------------------------------------------------------------
    // PATCH access-revocation
    // ----------------------------------------------------------------
    public async Task<UpdateRevocationAccessResponseDto> UpdateRevocationStatus(Guid userId)
    {
        var user = await FindTargetAsync(userId);

        if (user.Role == "Admin")
            throw new BadRequestException("Admin accounts cannot be revoked.");

        var isUserBanned = user.RevocationStatus != "Revoked";

        user.RevocationStatus = isUserBanned ? "Revoked" : "Active";
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Activity = isUserBanned ? "Revoke user access" : "Restore user access";
        audit.Details = $"{(isUserBanned ? "Revoked" : "Restored")} access of {Describe(user)}";

        // Revoked users must not keep working sessions
        if (isUserBanned)
            await ForceLogoutAsync(user.Id, null);

        return new UpdateRevocationAccessResponseDto
        {
            IsUserBanned = isUserBanned,
            Message = isUserBanned
                ? "User access revoked successfully."
                : "User access restored successfully."
        };
    }

    // ----------------------------------------------------------------
    // PATCH role-update
    // ----------------------------------------------------------------
    public async Task<UpdateRoleResponseDto> UpdateRole(Guid userId, UpdateRoleRequestDto request)
    {
        var user = await FindTargetAsync(userId);
        var role = request.Role?.Trim();

        if (string.IsNullOrWhiteSpace(role))
            throw new BadRequestException("Role is required.");

        if (!AssignableRoles.Contains(role))
        {
            audit.Details = $"Attempted to set invalid role '{Trunc(role)}' on {Describe(user)}";
            throw new BadRequestException("Invalid role. Allowed roles: Employee, Supervisor, Personnel.");
        }

        if (user.Role == "Admin")
            throw new BadRequestException("The role of an Admin account cannot be changed.");

        if (user.Role == role)
            throw new BadRequestException($"User already has the role '{role}'.");

        var oldRole = user.Role;
        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Changed role of {Describe(user)} from {oldRole} to {role}";

        return new UpdateRoleResponseDto
        {
            Role = role,
            Message = "User role updated successfully."
        };
    }

    // ----------------------------------------------------------------
    // PATCH password-change
    // ----------------------------------------------------------------
    public async Task<string> ChangePassword(Guid userId, ChangePasswordRequestDto request, Guid actorId, Guid? currentSessionId)
    {
        var user = await FindTargetAsync(userId);
        var password = request.NewPassword;

        // NEVER put the password in audit details / logs
        if (string.IsNullOrEmpty(password))
            throw new BadRequestException("New password is required.");
        if (password.Length < 8)
            throw new BadRequestException("New password must be at least 8 characters long.");
        if (Encoding.UTF8.GetByteCount(password) > 72)
            throw new BadRequestException("New password is too long (maximum 72 bytes).");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 10);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Changed password of {Describe(user)}";

        // Old sessions must not survive a password reset (keep the admin's own current one)
        await ForceLogoutAsync(user.Id, user.Id == actorId ? currentSessionId : null);

        return "User password changed successfully.";
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Asset registry
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // GET assets
    // ----------------------------------------------------------------
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

        // Keyword search (case-insensitive "contains")
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

        // Date added range (inclusive)
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
            .ThenBy(a => a.Id) // stable paging
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

    // ----------------------------------------------------------------
    // POST assets
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // PUT assets/{assetId}
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // DELETE assets/{assetId}
    // ----------------------------------------------------------------
    public async Task<string> DeleteAsset(Guid assetId)
    {
        var asset = await FindAssetAsync(assetId);

        db.Assets.Remove(asset);
        await db.SaveChangesAsync();

        audit.Details = $"Deleted asset {Describe(asset)}";

        return "Asset deleted successfully.";
    }

    // ----------------------------------------------------------------
    // Asset helpers
    // ----------------------------------------------------------------
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

    // Catches the race where two requests pass the duplicate check at the same time
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

    // Returns the canonical spelling of an allowed value (case-insensitive match)
    private static string PickAllowed(string? value, string[] allowed, string label, string? fallback)
    {
        var v = value?.Trim();
        if (string.IsNullOrWhiteSpace(v))
            return fallback ?? throw new BadRequestException($"Asset {label} is required.");

        return allowed.FirstOrDefault(a => a.Equals(v, StringComparison.OrdinalIgnoreCase))
            ?? throw new BadRequestException($"Invalid asset {label}. Allowed values: {string.Join(", ", allowed)}.");
    }

    // Escape LIKE wildcards so user input is matched literally (ILIKE default escape is '\')
    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private static string Describe(Assets a) => $"{a.Name} ({a.Tag})";

    private sealed record AssetInput(
        string Name, string Tag, string Description,
        string Status, string Condition, string Category, string Criticality);


    // ==================================================================================================================
    // ==================================================================================================================
    // System activity logs
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // GET activity-logs
    // ----------------------------------------------------------------
    public async Task<GetActivityLogsResponseDto> GetActivityLogs(int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);

        var total = await db.ActivityLogs.CountAsync();

        // Most recent first — decided here, frontend must not reorder
        var logs = await db.ActivityLogs.AsNoTracking()
            .OrderByDescending(l => l.Timestamp).ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ActivityLogDto.Projection)
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {logs.Count} of {total} logs";

        return new GetActivityLogsResponseDto
        {
            Message = "Activity logs retrieved successfully.",
            Logs = logs,
            TotalLogs = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Misc
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // Force logout the user in real-time
    // ----------------------------------------------------------------
    private async Task ForceLogoutAsync(Guid userId, Guid? exceptSessionId)
    {
        var ids = await db.Sessions
            .Where(s => s.UserId == userId && s.Id != exceptSessionId)
            .Select(s => s.Id)
            .ToListAsync();

        if (ids.Count == 0) return;

        await db.Sessions.Where(s => ids.Contains(s.Id)).ExecuteDeleteAsync();

        await Task.WhenAll(ids.Select(id =>
            hub.Clients.Group($"Session_{id}").SendAsync("LoggedOut")));
        await hub.Clients.Group($"User_{userId}").SendAsync("SessionsUpdated");
    }
}
