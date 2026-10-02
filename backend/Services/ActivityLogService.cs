using backend.Data;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IActivityLogService
{
    Task RecordAsync(string activity, string result, Guid? performedById, string? ipAddress,
        Guid? targetUserId, string? details, bool broadcast);
}

public class ActivityLogService(AppDbContext db, IHubContext<SyncHub> hub) : IActivityLogService
{
    public const string CreatedEvent = "ActivityLogCreated";

    public async Task RecordAsync(string activity, string result, Guid? performedById, string? ipAddress,
        Guid? targetUserId, string? details, bool broadcast)
    {
        // The request may have failed mid-SaveChanges; drop any poisoned tracked state
        // so we only insert the log row.
        db.ChangeTracker.Clear();

        var log = new ActivityLog
        {
            Activity = activity,
            Result = result,
            PerformedById = performedById,
            IpAddress = performedById is null ? ipAddress : null, // IP only when no identified actor
            TargetUserId = targetUserId,
            Details = details
        };

        db.ActivityLogs.Add(log);
        await db.SaveChangesAsync();

        if (!broadcast) return;

        var dto = await db.ActivityLogs.AsNoTracking()
            .Where(l => l.Id == log.Id)
            .Select(ActivityLogDto.Projection)
            .FirstAsync();

        await hub.Clients.Group(SyncHub.AdminGroup).SendAsync(CreatedEvent, dto);
    }
}
