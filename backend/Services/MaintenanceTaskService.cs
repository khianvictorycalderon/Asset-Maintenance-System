using backend.Auditing;
using backend.Data;
using backend.DTOs.Requests.Supervisor;
using backend.DTOs.Responses.Supervisor;
using backend.Exceptions;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class MaintenanceTaskService(AppDbContext db, AuditContext audit) : IMaintenanceTaskService
{
    private static readonly string[] AllowedStatuses = ["Pending", "In Progress", "Completed"];

    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    // Philippine timezone (UTC+8)
private static readonly TimeSpan PhilippineOffset = TimeSpan.FromHours(8);

// Gets the UTC equivalent of midnight in the Philippines.
private static DateTimeOffset PhilippineStartOfDayUtc(DateOnly date)
{
    var localMidnight = new DateTimeOffset(
        date.ToDateTime(TimeOnly.MinValue),
        PhilippineOffset
    );

    return localMidnight.ToUniversalTime();
}

// Determines the status displayed on the frontend.
private static string GetDisplayStatus(MaintenanceTask task)
{
    if (task.Status == "Completed")
        return "Completed";

    var nowInPhilippines = DateTimeOffset.UtcNow.ToOffset(PhilippineOffset);
    var today = DateOnly.FromDateTime(nowInPhilippines.DateTime);
    var todayStart = PhilippineStartOfDayUtc(today);

    if (task.DueAt < todayStart)
        return "Overdue";

    if (task.Status == "Pending")
        return "Scheduled";

    return task.Status;
}

    public async Task<GetMaintenanceTasksResponse> GetTasksAsync(
        GetMaintenanceTasksQuery query, Guid supervisorId, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = query.PageSize < 1 ? 5 : Math.Min(query.PageSize, 100);
        if (query.StartDate is not null && query.EndDate is not null &&
            query.StartDate > query.EndDate)
        {
            throw new BadRequestException("The start date cannot be later than the end date.");
        }

        var tasks = db.MaintenanceTasks.AsNoTracking()
            .Where(task => task.SupervisorId == supervisorId);
        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            tasks = tasks.Where(task =>
                EF.Functions.ILike(task.Name, pattern) ||
                EF.Functions.ILike(task.Description, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) &&
    !query.Status.Equals("All", StringComparison.OrdinalIgnoreCase) &&
    !query.Status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
{
    var status = query.Status.Trim();

    var nowInPhilippines = DateTimeOffset.UtcNow.ToOffset(PhilippineOffset);
    var today = DateOnly.FromDateTime(nowInPhilippines.DateTime);
    var todayStart = PhilippineStartOfDayUtc(today);

    if (status.Equals("Scheduled", StringComparison.OrdinalIgnoreCase) ||
        status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
    {
        tasks = tasks.Where(task =>
            task.Status == "Pending" &&
            task.DueAt >= todayStart);
    }
    else if (status.Equals("Overdue", StringComparison.OrdinalIgnoreCase))
    {
        tasks = tasks.Where(task =>
            task.Status != "Completed" &&
            task.DueAt < todayStart);
    }
    else if (status.Equals("In Progress", StringComparison.OrdinalIgnoreCase))
    {
        tasks = tasks.Where(task => task.Status == "In Progress");
    }
    else if (status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
    {
        tasks = tasks.Where(task => task.Status == "Completed");
    }
    else
    {
        throw new BadRequestException("The selected task status is invalid.");
    }
}

        if (query.PersonnelId is { } personnelId)
            tasks = tasks.Where(task => task.Assignees.Any(assignee => assignee.PersonnelId == personnelId));

        if (query.StartDate is { } start)
{
    var startAt = PhilippineStartOfDayUtc(start);

    tasks = tasks.Where(task => task.DueAt >= startAt);
}

if (query.EndDate is { } end)
{
    var endAt = PhilippineStartOfDayUtc(end.AddDays(1));

    tasks = tasks.Where(task => task.DueAt < endAt);
}

        var total = await tasks.CountAsync(cancellationToken);
        var items = await tasks
            .OrderBy(task => task.DueAt)
            .ThenBy(task => task.Name)
            .ThenBy(task => task.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(task => task.AssignedBy)
            .Include(task => task.Assignees)
                .ThenInclude(assignee => assignee.Personnel)
            .ToListAsync(cancellationToken);

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} maintenance tasks";
        return new GetMaintenanceTasksResponse(
            items.Select(ToResponse).ToList(),
            total,
            page,
            pageSize,
            TotalPagesOf(total, pageSize));
    }

    public async Task<MaintenanceTaskResponse?> GetTaskAsync(
        Guid taskId, Guid supervisorId, CancellationToken cancellationToken)
    {
        var task = await db.MaintenanceTasks.AsNoTracking()
            .Where(item => item.Id == taskId && item.SupervisorId == supervisorId)
            .Include(item => item.AssignedBy)
            .Include(item => item.Assignees)
                .ThenInclude(assignee => assignee.Personnel)
            .FirstOrDefaultAsync(cancellationToken);

        return task is null ? null : ToResponse(task);
    }

    public async Task<GetMaintenanceTaskPersonnelOptionsResponse> GetPersonnelOptionsAsync(
        Guid supervisorId, CancellationToken cancellationToken)
    {
        var personnel = await db.PersonnelAssignments.AsNoTracking()
            .Where(assignment =>
                assignment.SupervisorId == supervisorId &&
                assignment.Personnel.Role == "Personnel" &&
                assignment.Personnel.RevocationStatus != "Revoked")
            .OrderBy(assignment => assignment.Personnel.LastName)
            .ThenBy(assignment => assignment.Personnel.FirstName)
            .Select(assignment => new MaintenanceTaskPersonnelOption(
                assignment.PersonnelId,
                assignment.Personnel.FirstName + " " + assignment.Personnel.LastName,
                assignment.Personnel.Email))
            .ToListAsync(cancellationToken);

        return new GetMaintenanceTaskPersonnelOptionsResponse(personnel);
    }

    public async Task<MaintenanceTaskResponse> SaveTaskAsync(
        Guid? taskId, SaveMaintenanceTaskRequest request, Guid supervisorId, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var description = request.Description.Trim();
        if (name.Length == 0)
            throw new BadRequestException("Task name is required.");
        if (description.Length == 0)
            throw new BadRequestException("Task description is required.");
        if (!AllowedStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
            throw new BadRequestException("The selected task status is invalid.");
        if (request.DueAt == default)
            throw new BadRequestException("Task deadline is required.");

        var personnelIds = request.PersonnelIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();
        if (personnelIds.Count == 0)
            throw new BadRequestException("Select at least one personnel member.");
        if (personnelIds.Count > 100)
            throw new BadRequestException("You can assign at most 100 personnel members to a task.");

        var eligiblePersonnelCount = await db.PersonnelAssignments
            .Where(assignment =>
                assignment.SupervisorId == supervisorId &&
                personnelIds.Contains(assignment.PersonnelId) &&
                assignment.Personnel.Role == "Personnel" &&
                assignment.Personnel.RevocationStatus != "Revoked")
            .Select(assignment => assignment.PersonnelId)
            .Distinct()
            .CountAsync(cancellationToken);
        if (eligiblePersonnelCount != personnelIds.Count)
            throw new BadRequestException("One or more selected personnel are not assigned to you or are unavailable.");

        MaintenanceTask task;
        if (taskId is { } id)
        {
            task = await db.MaintenanceTasks
                .Include(item => item.Assignees)
                .FirstOrDefaultAsync(
                    item => item.Id == id && item.SupervisorId == supervisorId,
                    cancellationToken)
                ?? throw new KeyNotFoundException("Maintenance task was not found.");

            var retainedIds = task.Assignees
                .Where(assignee => personnelIds.Contains(assignee.PersonnelId))
                .Select(assignee => assignee.PersonnelId)
                .ToHashSet();
            foreach (var assignee in task.Assignees.ToList())
            {
                if (!personnelIds.Contains(assignee.PersonnelId))
                {
                    task.Assignees.Remove(assignee);
                    db.MaintenanceTaskAssignees.Remove(assignee);
                }
            }
            foreach (var personnelId in personnelIds.Where(id => !retainedIds.Contains(id)))
            {
                task.Assignees.Add(new MaintenanceTaskAssignee
                {
                    TaskId = task.Id,
                    PersonnelId = personnelId
                });
            }
            task.Name = name;
            task.Description = description;
            task.DueAt = request.DueAt.ToUniversalTime();
            task.Status = AllowedStatuses.First(status =>
                status.Equals(request.Status, StringComparison.OrdinalIgnoreCase));
            task.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            task = new MaintenanceTask
            {
                SupervisorId = supervisorId,
                AssignedById = supervisorId,
                Name = name,
                Description = description,
                DueAt = request.DueAt.ToUniversalTime(),
                Status = AllowedStatuses.First(status =>
                    status.Equals(request.Status, StringComparison.OrdinalIgnoreCase)),
                Assignees = personnelIds
                    .Select(personnelId => new MaintenanceTaskAssignee
                    {
                        PersonnelId = personnelId
                    })
                    .ToList()
            };
            db.MaintenanceTasks.Add(task);
        }

        await db.SaveChangesAsync(cancellationToken);
        audit.Details = $"{(taskId is null ? "Created" : "Updated")} maintenance task '{name}' for {personnelIds.Count} personnel";

        await db.Entry(task).Reference(item => item.AssignedBy).LoadAsync(cancellationToken);
        foreach (var assignee in task.Assignees)
            await db.Entry(assignee).Reference(item => item.Personnel).LoadAsync(cancellationToken);

        return ToResponse(task);
    }

    public async Task DeleteTaskAsync(
        Guid taskId, Guid supervisorId, CancellationToken cancellationToken)
    {
        var task = await db.MaintenanceTasks
            .FirstOrDefaultAsync(item => item.Id == taskId && item.SupervisorId == supervisorId, cancellationToken)
            ?? throw new KeyNotFoundException("Maintenance task was not found.");

        db.MaintenanceTasks.Remove(task);
        await db.SaveChangesAsync(cancellationToken);
        audit.Details = $"Deleted maintenance task '{task.Name}'";
    }

    private static MaintenanceTaskResponse ToResponse(MaintenanceTask task) =>
        new(
            task.Id,
            task.Name,
            task.Description,
            task.DueAt,
            GetDisplayStatus(task),
            task.AssignedById,
            task.AssignedBy is null
                ? null
                : $"{task.AssignedBy.FirstName} {task.AssignedBy.LastName}",
            task.Assignees
                .OrderBy(assignee => assignee.Personnel.LastName)
                .ThenBy(assignee => assignee.Personnel.FirstName)
                .Select(assignee => new MaintenanceTaskAssigneeResponse(
                    assignee.PersonnelId,
                    $"{assignee.Personnel.FirstName} {assignee.Personnel.LastName}"))
                .ToList(),
            new DateTimeOffset(DateTime.SpecifyKind(task.CreatedAt, DateTimeKind.Utc)));
}
