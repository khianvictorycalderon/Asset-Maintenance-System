using backend.Auditing;
using backend.Data;
using backend.DTOs;
using backend.DTOs.Requests;
using backend.Exceptions;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Services;

public class AssignmentService(AppDbContext db, AuditContext audit) : IAssignmentService
{
    private const int MaxBatch = 100;
    private const int MaxOptionLimit = 200;

    private static (int Page, int PageSize) Normalize(int page, int pageSize) =>
        (Math.Max(page, 1), pageSize < 1 ? 10 : Math.Min(pageSize, 100));

    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    private static string EscapeLike(string s) =>
        s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow);

    private static string Describe(User u) => $"{u.FirstName} {u.LastName} ({u.Email})";

    // "A, B, C and 4 more" - keeps messages / audit details short
    private static string NameList(IEnumerable<string> names, int show = 5)
    {
        var list = names.ToList();
        var head = string.Join(", ", list.Take(show));
        return list.Count > show ? $"{head} and {list.Count - show} more" : head;
    }

    // ==================================================================================================================
    // Shared helpers
    // ==================================================================================================================

    private static void ValidateDateRange(GetAssignmentsQueryDto query)
    {
        if (query.StartDate is not null && query.EndDate is not null && query.StartDate > query.EndDate)
            throw new BadRequestException("The start date cannot be later than the end date.");
    }

    // The target must exist, be a Supervisor and still have access.
    private async Task<User> RequireSupervisorAsync(Guid? supervisorId)
    {
        if (supervisorId is null || supervisorId == Guid.Empty)
            throw new BadRequestException("Supervisor is required.");

        var supervisor = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == supervisorId);
        if (supervisor is null || supervisor.Role != "Supervisor")
            throw new BadRequestException("The selected supervisor is invalid.");
        if (supervisor.RevocationStatus == "Revoked")
            throw new BadRequestException("The selected supervisor's access has been revoked.");

        audit.TargetUserId = supervisor.Id; // only set once we know it exists (FK)
        return supervisor;
    }

    private static List<Guid> NormalizeIds(List<Guid>? raw, string singular, string plural)
    {
        var ids = (raw ?? []).Where(i => i != Guid.Empty).Distinct().ToList();
        if (ids.Count == 0)
            throw new BadRequestException($"Select at least one {singular}.");
        if (ids.Count > MaxBatch)
            throw new BadRequestException($"You can assign at most {MaxBatch} {plural} at a time.");
        return ids;
    }

    private async Task SaveAsync(string conflictMessage)
    {
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two employees assigned the same asset / personnel at the same moment
            throw new BadRequestException(conflictMessage);
        }
    }

    // ==================================================================================================================
    // Supervisor dropdown (assign form, Edit modal, "Supervisor" filter)
    // ==================================================================================================================
    public async Task<GetSupervisorOptionsResponseDto> GetSupervisorOptions(bool includeRevoked)
    {
        var supervisors = db.Users.AsNoTracking().Where(u => u.Role == "Supervisor");
        if (!includeRevoked)
            supervisors = supervisors.Where(u => u.RevocationStatus != "Revoked");

        var items = await supervisors
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
            .Select(u => new SupervisorOptionDto
            {
                Id = u.Id,
                FullName = u.FirstName + " " + u.LastName,
                Username = u.Email,
                IsRevoked = u.RevocationStatus == "Revoked"
            })
            .ToListAsync();

        return new GetSupervisorOptionsResponseDto
        {
            Message = "Supervisors retrieved successfully.",
            Supervisors = items
        };
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Asset assignments
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // GET asset assignments (table: search + filters + pagination)
    // ----------------------------------------------------------------
    public async Task<GetAssetAssignmentsResponseDto> GetAssetAssignments(GetAssignmentsQueryDto query)
    {
        var (page, pageSize) = Normalize(query.Page, query.PageSize);
        ValidateDateRange(query);

        var rows = db.AssetAssignments.AsNoTracking().AsQueryable();

        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            rows = rows.Where(a =>
                EF.Functions.ILike(a.Asset.Name, pattern) ||
                EF.Functions.ILike(a.Asset.Tag, pattern));
        }

        if (query.SupervisorId is { } supervisorId) rows = rows.Where(a => a.SupervisorId == supervisorId);
        if (query.AssignedById is { } assignedById) rows = rows.Where(a => a.AssignedById == assignedById);
        if (query.StartDate is { } start) rows = rows.Where(a => a.DateAssigned >= start);
        if (query.EndDate is { } end) rows = rows.Where(a => a.DateAssigned <= end);

        var total = await rows.CountAsync();

        // Newest first - decided here, frontend must not reorder
        var items = await rows
            .OrderByDescending(a => a.DateAssigned).ThenBy(a => a.Asset.Name).ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(AssetAssignmentDto.Projection)
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} asset assignments";

        return new GetAssetAssignmentsResponseDto
        {
            Message = "Asset assignments retrieved successfully.",
            Assignments = items,
            TotalAssignments = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ----------------------------------------------------------------
    // GET asset multi-select options (already assigned ones are flagged)
    // ----------------------------------------------------------------
    public async Task<GetAssetOptionsResponseDto> GetAssetOptions(string? keyword, int limit)
    {
        limit = Math.Clamp(limit, 1, MaxOptionLimit);

        var assets = db.Assets.AsNoTracking().AsQueryable();
        var term = keyword?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            var pattern = $"%{EscapeLike(term)}%";
            assets = assets.Where(a => EF.Functions.ILike(a.Name, pattern) || EF.Functions.ILike(a.Tag, pattern));
        }

        var total = await assets.CountAsync();

        var items = await assets
            .OrderBy(a => a.Name).ThenBy(a => a.Id)
            .Take(limit)
            .Select(a => new AssetOptionDto
            {
                Id = a.Id,
                Name = a.Name,
                Tag = a.Tag,
                Category = a.Category,
                IsAssigned = db.AssetAssignments.Any(x => x.AssetId == a.Id),
                AssignedTo = db.AssetAssignments
                    .Where(x => x.AssetId == a.Id)
                    .Select(x => x.Supervisor.FirstName + " " + x.Supervisor.LastName)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return new GetAssetOptionsResponseDto
        {
            Message = "Assets retrieved successfully.",
            Assets = items,
            TotalAssets = total
        };
    }

    // ----------------------------------------------------------------
    // GET "Assigned by" filter options (people who made at least one asset assignment)
    // ----------------------------------------------------------------
    public async Task<GetAssignerOptionsResponseDto> GetAssetAssignerOptions()
    {
        var assignerIds = db.AssetAssignments
            .Where(a => a.AssignedById != null)
            .Select(a => a.AssignedById!.Value)
            .Distinct();

        return new GetAssignerOptionsResponseDto
        {
            Message = "Assigners retrieved successfully.",
            Assigners = await db.Users.AsNoTracking()
                .Where(u => assignerIds.Contains(u.Id))
                .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
                .Select(u => new AssignerOptionDto { Id = u.Id, FullName = u.FirstName + " " + u.LastName })
                .ToListAsync()
        };
    }

    // ----------------------------------------------------------------
    // POST assign one or more assets to a supervisor
    // ----------------------------------------------------------------
    public async Task<AssignAssetsResponseDto> AssignAssets(AssignAssetsRequestDto request, Guid actorId)
    {
        var ids = NormalizeIds(request.AssetIds, "asset", "assets");
        var supervisor = await RequireSupervisorAsync(request.SupervisorId);

        var assets = await db.Assets.AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .Select(a => new { a.Id, a.Name, a.Tag })
            .ToListAsync();
        if (assets.Count != ids.Count)
            throw new BadRequestException("One or more selected assets no longer exist. Please refresh and try again.");

        // An asset has exactly one supervisor - the whole request is rejected so nothing is half-applied
        var takenIds = await db.AssetAssignments.AsNoTracking()
            .Where(x => ids.Contains(x.AssetId))
            .Select(x => x.AssetId)
            .ToListAsync();
        var taken = assets
            .Where(a => takenIds.Contains(a.Id))
            .Select(a => $"{a.Name} ({a.Tag})")
            .ToList();
        if (taken.Count > 0)
            throw new BadRequestException(
                $"These assets already have a supervisor: {NameList(taken)}. Use Edit to move them.");

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var created = assets.Select(a => new AssetAssignment
        {
            AssetId = a.Id,
            SupervisorId = supervisor.Id,
            AssignedById = actorId,
            DateAssigned = today,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        db.AssetAssignments.AddRange(created);
        await SaveAsync("One or more selected assets were just assigned by someone else. Please refresh and try again.");

        var createdIds = created.Select(c => c.Id).ToList();
        var result = await db.AssetAssignments.AsNoTracking()
            .Where(a => createdIds.Contains(a.Id))
            .OrderBy(a => a.Asset.Name).ThenBy(a => a.Id)
            .Select(AssetAssignmentDto.Projection)
            .ToListAsync();

        audit.Details = $"Assigned {created.Count} asset(s) to {Describe(supervisor)}: " +
                        NameList(assets.Select(a => $"{a.Name} ({a.Tag})"));

        return new AssignAssetsResponseDto
        {
            Message = created.Count == 1
                ? "Asset assigned successfully."
                : $"{created.Count} assets assigned successfully.",
            Assignments = result
        };
    }

    // ----------------------------------------------------------------
    // PUT move an existing asset assignment to another supervisor
    // ----------------------------------------------------------------
    public async Task<AssetAssignmentResponseDto> UpdateAssetAssignment(
        Guid assignmentId, UpdateAssignmentRequestDto request, Guid actorId)
    {
        var assignment = await db.AssetAssignments
            .Include(a => a.Asset)
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new KeyNotFoundException("Asset assignment not found.");

        var supervisor = await RequireSupervisorAsync(request.SupervisorId);
        var assetLabel = $"{assignment.Asset.Name} ({assignment.Asset.Tag})";

        if (assignment.SupervisorId == supervisor.Id)
            throw new BadRequestException("This asset is already assigned to the selected supervisor.");

        var previous = await db.Users.AsNoTracking()
            .Where(u => u.Id == assignment.SupervisorId)
            .Select(u => u.FirstName + " " + u.LastName)
            .FirstOrDefaultAsync() ?? "unknown";

        // A reassignment is a new hand-over: record who did it and when
        assignment.SupervisorId = supervisor.Id;
        assignment.AssignedById = actorId;
        assignment.DateAssigned = Today();
        assignment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Moved asset {assetLabel} from {previous} to {Describe(supervisor)}";

        return new AssetAssignmentResponseDto
        {
            Message = "Asset assignment updated successfully.",
            Assignment = await db.AssetAssignments.AsNoTracking()
                .Where(a => a.Id == assignmentId)
                .Select(AssetAssignmentDto.Projection)
                .FirstAsync()
        };
    }

    // ----------------------------------------------------------------
    // DELETE asset assignment (asset becomes unassigned again)
    // ----------------------------------------------------------------
    public async Task<string> DeleteAssetAssignment(Guid assignmentId)
    {
        var info = await db.AssetAssignments.AsNoTracking()
            .Where(a => a.Id == assignmentId)
            .Select(a => new
            {
                Asset = a.Asset.Name + " (" + a.Asset.Tag + ")",
                a.SupervisorId,
                Supervisor = a.Supervisor.FirstName + " " + a.Supervisor.LastName
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Asset assignment not found.");

        var deleted = await db.AssetAssignments.Where(a => a.Id == assignmentId).ExecuteDeleteAsync();
        if (deleted == 0)
            throw new KeyNotFoundException("Asset assignment not found.");

        audit.TargetUserId = info.SupervisorId;
        audit.Details = $"Removed assignment of asset {info.Asset} from supervisor {info.Supervisor}";
        return "Asset assignment deleted successfully.";
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // Personnel assignments
    // ==================================================================================================================
    // ==================================================================================================================

    // ----------------------------------------------------------------
    // GET personnel assignments (table: search + filters + pagination)
    // ----------------------------------------------------------------
    public async Task<GetPersonnelAssignmentsResponseDto> GetPersonnelAssignments(GetAssignmentsQueryDto query)
    {
        var (page, pageSize) = Normalize(query.Page, query.PageSize);
        ValidateDateRange(query);

        var rows = db.PersonnelAssignments.AsNoTracking().AsQueryable();

        // "Name or username..." - username is the account email
        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            rows = rows.Where(a =>
                EF.Functions.ILike(a.Personnel.FirstName + " " + a.Personnel.LastName, pattern) ||
                EF.Functions.ILike(a.Personnel.Email, pattern));
        }

        if (query.SupervisorId is { } supervisorId) rows = rows.Where(a => a.SupervisorId == supervisorId);
        if (query.AssignedById is { } assignedById) rows = rows.Where(a => a.AssignedById == assignedById);
        if (query.StartDate is { } start) rows = rows.Where(a => a.DateAssigned >= start);
        if (query.EndDate is { } end) rows = rows.Where(a => a.DateAssigned <= end);

        var total = await rows.CountAsync();

        // Newest first - decided here, frontend must not reorder
        var items = await rows
            .OrderByDescending(a => a.DateAssigned)
            .ThenBy(a => a.Personnel.LastName).ThenBy(a => a.Personnel.FirstName).ThenBy(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(PersonnelAssignmentDto.Projection)
            .ToListAsync();

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} personnel assignments";

        return new GetPersonnelAssignmentsResponseDto
        {
            Message = "Personnel assignments retrieved successfully.",
            Assignments = items,
            TotalAssignments = total,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = TotalPagesOf(total, pageSize)
        };
    }

    // ----------------------------------------------------------------
    // GET personnel multi-select options (already assigned ones are flagged)
    // ----------------------------------------------------------------
    public async Task<GetPersonnelOptionsResponseDto> GetPersonnelOptions(string? keyword, int limit)
    {
        limit = Math.Clamp(limit, 1, MaxOptionLimit);

        var people = db.Users.AsNoTracking()
            .Where(u => u.Role == "Personnel" && u.RevocationStatus != "Revoked");

        var term = keyword?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            var pattern = $"%{EscapeLike(term)}%";
            people = people.Where(u =>
                EF.Functions.ILike(u.FirstName + " " + u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        var total = await people.CountAsync();

        var items = await people
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
            .Take(limit)
            .Select(u => new PersonnelOptionDto
            {
                Id = u.Id,
                FullName = u.FirstName + " " + u.LastName,
                Username = u.Email,
                IsAssigned = db.PersonnelAssignments.Any(x => x.PersonnelId == u.Id),
                AssignedTo = db.PersonnelAssignments
                    .Where(x => x.PersonnelId == u.Id)
                    .Select(x => x.Supervisor.FirstName + " " + x.Supervisor.LastName)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return new GetPersonnelOptionsResponseDto
        {
            Message = "Personnel retrieved successfully.",
            Personnel = items,
            TotalPersonnel = total
        };
    }

    // ----------------------------------------------------------------
    // GET "Assigned by" filter options (people who made at least one personnel assignment)
    // ----------------------------------------------------------------
    public async Task<GetAssignerOptionsResponseDto> GetPersonnelAssignerOptions()
    {
        var assignerIds = db.PersonnelAssignments
            .Where(a => a.AssignedById != null)
            .Select(a => a.AssignedById!.Value)
            .Distinct();

        return new GetAssignerOptionsResponseDto
        {
            Message = "Assigners retrieved successfully.",
            Assigners = await db.Users.AsNoTracking()
                .Where(u => assignerIds.Contains(u.Id))
                .OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id)
                .Select(u => new AssignerOptionDto { Id = u.Id, FullName = u.FirstName + " " + u.LastName })
                .ToListAsync()
        };
    }

    // ----------------------------------------------------------------
    // POST assign one or more personnel to a supervisor
    // ----------------------------------------------------------------
    public async Task<AssignPersonnelResponseDto> AssignPersonnel(AssignPersonnelRequestDto request, Guid actorId)
    {
        var ids = NormalizeIds(request.PersonnelIds, "personnel", "personnel");
        var supervisor = await RequireSupervisorAsync(request.SupervisorId);

        var people = await db.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id) && u.Role == "Personnel" && u.RevocationStatus != "Revoked")
            .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
            .ToListAsync();
        if (people.Count != ids.Count)
            throw new BadRequestException("One or more selected personnel are invalid or no longer active. Please refresh and try again.");

        // A personnel has exactly one supervisor - the whole request is rejected so nothing is half-applied
        var takenIds = await db.PersonnelAssignments.AsNoTracking()
            .Where(x => ids.Contains(x.PersonnelId))
            .Select(x => x.PersonnelId)
            .ToListAsync();
        var taken = people
            .Where(p => takenIds.Contains(p.Id))
            .Select(p => p.Name)
            .ToList();
        if (taken.Count > 0)
            throw new BadRequestException(
                $"These personnel already have a supervisor: {NameList(taken)}. Use Edit to move them.");

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var created = people.Select(p => new PersonnelAssignment
        {
            PersonnelId = p.Id,
            SupervisorId = supervisor.Id,
            AssignedById = actorId,
            DateAssigned = today,
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        db.PersonnelAssignments.AddRange(created);
        await SaveAsync("One or more selected personnel were just assigned by someone else. Please refresh and try again.");

        var createdIds = created.Select(c => c.Id).ToList();
        var result = await db.PersonnelAssignments.AsNoTracking()
            .Where(a => createdIds.Contains(a.Id))
            .OrderBy(a => a.Personnel.LastName).ThenBy(a => a.Personnel.FirstName).ThenBy(a => a.Id)
            .Select(PersonnelAssignmentDto.Projection)
            .ToListAsync();

        audit.Details = $"Assigned {created.Count} personnel to {Describe(supervisor)}: " +
                        NameList(people.Select(p => p.Name));

        return new AssignPersonnelResponseDto
        {
            Message = created.Count == 1
                ? "Personnel assigned successfully."
                : $"{created.Count} personnel assigned successfully.",
            Assignments = result
        };
    }

    // ----------------------------------------------------------------
    // PUT move an existing personnel assignment to another supervisor
    // ----------------------------------------------------------------
    public async Task<PersonnelAssignmentResponseDto> UpdatePersonnelAssignment(
        Guid assignmentId, UpdateAssignmentRequestDto request, Guid actorId)
    {
        var assignment = await db.PersonnelAssignments
            .Include(a => a.Personnel)
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new KeyNotFoundException("Personnel assignment not found.");

        var supervisor = await RequireSupervisorAsync(request.SupervisorId);
        var personLabel = Describe(assignment.Personnel);

        if (assignment.SupervisorId == supervisor.Id)
            throw new BadRequestException("This personnel is already assigned to the selected supervisor.");

        var previous = await db.Users.AsNoTracking()
            .Where(u => u.Id == assignment.SupervisorId)
            .Select(u => u.FirstName + " " + u.LastName)
            .FirstOrDefaultAsync() ?? "unknown";

        // A reassignment is a new hand-over: record who did it and when
        assignment.SupervisorId = supervisor.Id;
        assignment.AssignedById = actorId;
        assignment.DateAssigned = Today();
        assignment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        audit.Details = $"Moved personnel {personLabel} from {previous} to {Describe(supervisor)}";

        return new PersonnelAssignmentResponseDto
        {
            Message = "Personnel assignment updated successfully.",
            Assignment = await db.PersonnelAssignments.AsNoTracking()
                .Where(a => a.Id == assignmentId)
                .Select(PersonnelAssignmentDto.Projection)
                .FirstAsync()
        };
    }

    // ----------------------------------------------------------------
    // DELETE personnel assignment (personnel becomes unassigned again)
    // ----------------------------------------------------------------
    public async Task<string> DeletePersonnelAssignment(Guid assignmentId)
    {
        var info = await db.PersonnelAssignments.AsNoTracking()
            .Where(a => a.Id == assignmentId)
            .Select(a => new
            {
                Personnel = a.Personnel.FirstName + " " + a.Personnel.LastName,
                a.SupervisorId,
                Supervisor = a.Supervisor.FirstName + " " + a.Supervisor.LastName
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Personnel assignment not found.");

        var deleted = await db.PersonnelAssignments.Where(a => a.Id == assignmentId).ExecuteDeleteAsync();
        if (deleted == 0)
            throw new KeyNotFoundException("Personnel assignment not found.");

        audit.TargetUserId = info.SupervisorId;
        audit.Details = $"Removed assignment of personnel {info.Personnel} from supervisor {info.Supervisor}";
        return "Personnel assignment deleted successfully.";
    }
}
