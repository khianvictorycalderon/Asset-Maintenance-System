using backend.Auditing;
using backend.Data;
using backend.DTOs.Requests.Personnel;
using backend.DTOs.Responses.Personnel;
using backend.Exceptions;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class PersonnelMaintenanceTasksService(
    AppDbContext db, AuditContext audit, IHubContext<SyncHub> hub) : IPersonnelMaintenanceTasksService
{
    private static readonly string[] AllowedStatuses = ["Pending", "In Progress", "Completed"];

    private static int TotalPagesOf(int total, int pageSize) =>
        Math.Max(1, (int)Math.Ceiling(total / (double)pageSize));

    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    public async Task<GetPersonnelMaintenanceTasksResponse> GetTasksAsync(
        GetPersonnelMaintenanceTasksQuery query, Guid personnelId, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);
        if (query.StartDate is not null && query.EndDate is not null && query.StartDate > query.EndDate)
            throw new BadRequestException("The start date cannot be later than the end date.");

        // A personnel only ever sees the tasks they are an assignee of.
        var tasks = db.MaintenanceTasks.AsNoTracking()
            .Where(task => task.Assignees.Any(assignee => assignee.PersonnelId == personnelId));

        var keyword = query.Keyword?.Trim();
        if (!string.IsNullOrEmpty(keyword))
        {
            var pattern = $"%{EscapeLike(keyword)}%";
            tasks = tasks.Where(task => EF.Functions.ILike(task.Name, pattern));
        }

        var description = query.Description?.Trim();
        if (!string.IsNullOrEmpty(description))
        {
            var pattern = $"%{EscapeLike(description)}%";
            tasks = tasks.Where(task => EF.Functions.ILike(task.Description, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            !query.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var status = AllowedStatuses.FirstOrDefault(value =>
                value.Equals(query.Status, StringComparison.OrdinalIgnoreCase))
                ?? throw new BadRequestException("The selected task status is invalid.");
            tasks = tasks.Where(task => task.Status == status);
        }

        // "Date assigned" = the day the supervisor created (assigned) the task.
        if (query.StartDate is { } start)
        {
            var startAt = start.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            tasks = tasks.Where(task => task.CreatedAt >= startAt);
        }

        if (query.EndDate is { } end)
        {
            var endAt = end.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            tasks = tasks.Where(task => task.CreatedAt < endAt);
        }

        var total = await tasks.CountAsync(cancellationToken);
        var items = await tasks
            .OrderBy(task => task.DueAt)
            .ThenBy(task => task.Name)
            .ThenBy(task => task.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(task => task.Supervisor)
            .ToListAsync(cancellationToken);

        audit.Details = $"Returned page {page} (page size {pageSize}), {items.Count} of {total} assigned maintenance tasks";
        return new GetPersonnelMaintenanceTasksResponse(
            items.Select(ToResponse).ToList(), total, page, pageSize, TotalPagesOf(total, pageSize));
    }

    public async Task<PersonnelMaintenanceTaskResponse> UpdateStatusAsync(
        Guid taskId, UpdatePersonnelTaskStatusRequest request, Guid personnelId, CancellationToken cancellationToken)
    {
        var status = AllowedStatuses.FirstOrDefault(value =>
            value.Equals(request.Status, StringComparison.OrdinalIgnoreCase))
            ?? throw new BadRequestException("The selected task status is invalid.");

        // Same 404 for "doesn't exist" and "not yours" so task ids can't be probed.
        var task = await db.MaintenanceTasks
            .Include(item => item.Supervisor)
            .Include(item => item.Assignees)
            .FirstOrDefaultAsync(
                item => item.Id == taskId &&
                        item.Assignees.Any(assignee => assignee.PersonnelId == personnelId),
                cancellationToken)
            ?? throw new KeyNotFoundException("Maintenance task was not found.");

        var previous = task.Status;
        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        audit.Details = $"Changed status of maintenance task '{task.Name}' from '{previous}' to '{status}'";

        // Real-time sync: the supervisor and every co-assignee refresh their lists.
        var recipients = task.Assignees
            .Select(assignee => assignee.PersonnelId)
            .Append(task.SupervisorId)
            .Distinct()
            .Select(id => $"User_{id}")
            .ToList();
        await hub.Clients.Groups(recipients).SendAsync("MaintenanceTasksUpdated", cancellationToken);

        return ToResponse(task);
    }

    private static PersonnelMaintenanceTaskResponse ToResponse(MaintenanceTask task) =>
        new(
            task.Id,
            task.Name,
            task.Description,
            task.DueAt,
            task.Status,
            task.SupervisorId,
            $"{task.Supervisor.FirstName} {task.Supervisor.LastName}",
            new DateTimeOffset(DateTime.SpecifyKind(task.CreatedAt, DateTimeKind.Utc)));
}
