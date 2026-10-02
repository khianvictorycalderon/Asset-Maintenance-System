using System.Linq.Expressions;
using backend.Models;

namespace backend.DTOs;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string Activity { get; set; } = string.Empty;
    // Full name when the actor is identified, otherwise null (use IpAddress)
    public string? PerformedBy { get; set; }
    public Guid? PerformedByUserId { get; set; }
    public string? TargetUser { get; set; }
    public string Result { get; set; } = string.Empty;
    public DateOnly DatePerformed { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public string? Details { get; set; }

    // Shared by the GET endpoint and the SignalR broadcast so both have the same shape.
    public static readonly Expression<Func<ActivityLog, ActivityLogDto>> Projection = l => new ActivityLogDto
    {
        Id = l.Id,
        Activity = l.Activity,
        PerformedBy = l.PerformedBy == null ? null : l.PerformedBy.FirstName + " " + l.PerformedBy.LastName,
        PerformedByUserId = l.PerformedById,
        TargetUser = l.TargetUser == null ? null : l.TargetUser.FirstName + " " + l.TargetUser.LastName,
        Result = l.Result,
        DatePerformed = l.DatePerformed,
        Timestamp = l.Timestamp,
        IpAddress = l.IpAddress,
        Details = l.Details
    };
}

public class GetActivityLogsResponseDto
{
    public string Message { get; set; } = "";
    public List<ActivityLogDto> Logs { get; set; } = [];
    public int TotalLogs { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
