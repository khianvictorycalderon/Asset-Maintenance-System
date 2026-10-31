using backend.Data;
using backend.DTOs.Responses;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public sealed class DashboardService(AppDbContext db) : IDashboardService
{
    private static readonly string[] AssetStatuses = ["Active", "Inactive", "Under Maintenance"];
    private static readonly string[] TaskStatuses = ["Pending", "In Progress", "Completed"];
    private static readonly string[] UserRoles = ["Admin", "Employee", "Supervisor", "Personnel"];
    private static readonly TimeSpan PhilippineOffset = TimeSpan.FromHours(8);

    public Task<DashboardResponse> GetDashboardAsync(
        Guid userId,
        string role,
        CancellationToken cancellationToken) =>
        role switch
        {
            "Admin" => GetAdminDashboardAsync(cancellationToken),
            "Employee" => GetEmployeeDashboardAsync(cancellationToken),
            "Supervisor" => GetSupervisorDashboardAsync(userId, cancellationToken),
            "Personnel" => GetPersonnelDashboardAsync(userId, cancellationToken),
            _ => throw new InvalidOperationException($"Unsupported dashboard role '{role}'.")
        };

    private async Task<DashboardResponse> GetAdminDashboardAsync(CancellationToken cancellationToken)
    {
        var usersByRole = await GetUsersByRoleAsync(cancellationToken);
        var assetStatuses = await GetAssetStatusesAsync(db.Assets.AsNoTracking(), cancellationToken);
        var taskStatuses = await GetTaskStatusesAsync(db.MaintenanceTasks.AsNoTracking(), cancellationToken);
        var activeUsers = usersByRole.Values.Sum();
        var totalAssets = assetStatuses.Values.Sum();
        var totalTasks = taskStatuses.Values.Sum();

        return new DashboardResponse(
            "Admin",
            [
                new("Active Users", activeUsers.ToString(), "users", "All non-revoked accounts"),
                new("Total Assets", totalAssets.ToString(), "assets", "Across the asset registry"),
                new("Maintenance Tasks", totalTasks.ToString(), "tasks", "All assigned tasks"),
                new("Open Tasks", (totalTasks - taskStatuses.GetValueOrDefault("Completed")).ToString(), "alert",
                    "Pending or in progress")
            ],
            [
                CreateChart("Users by Role", "doughnut", UserRoles, usersByRole),
                CreateChart("Assets by Status", "doughnut", AssetStatuses, assetStatuses),
                CreateChart("Maintenance Tasks", "bar", TaskStatuses, taskStatuses)
            ]);
    }

    private async Task<DashboardResponse> GetEmployeeDashboardAsync(CancellationToken cancellationToken)
    {
        var assetStatuses = await GetAssetStatusesAsync(db.Assets.AsNoTracking(), cancellationToken);
        var totalAssets = assetStatuses.Values.Sum();
        var unassignedAssets = await db.Assets.AsNoTracking()
            .CountAsync(asset => !db.AssetAssignments.Any(assignment => assignment.AssetId == asset.Id), cancellationToken);
        var assignedSupervisors = await db.AssetAssignments.AsNoTracking()
            .Select(assignment => assignment.SupervisorId)
            .Distinct()
            .CountAsync(cancellationToken);
        var activePersonnel = await db.Users.AsNoTracking()
            .CountAsync(user => user.Role == "Personnel" && user.RevocationStatus != "Revoked", cancellationToken);
        var usersByRole = await GetUsersByRoleAsync(cancellationToken);
        var assetsByCategory = await db.Assets.AsNoTracking()
            .GroupBy(asset => asset.Category)
            .Select(group => new { Category = group.Key, Count = group.Count() })
            .OrderByDescending(group => group.Count)
            .ThenBy(group => group.Category)
            .Take(6)
            .ToListAsync(cancellationToken);

        return new DashboardResponse(
            "Employee",
            [
                new("Registered Assets", totalAssets.ToString(), "assets", "In the asset registry"),
                new("Unassigned Assets", unassignedAssets.ToString(), "alert", "Available for assignment"),
                new("Assigned Supervisors", assignedSupervisors.ToString(), "users", "Managing assigned assets"),
                new("Active Personnel", activePersonnel.ToString(), "people", "Non-revoked personnel accounts")
            ],
            [
                CreateChart("Assets by Status", "doughnut", AssetStatuses, assetStatuses),
                new DashboardChart(
                    "Top Asset Categories",
                    "bar",
                    assetsByCategory.Select(item => item.Category).ToArray(),
                    assetsByCategory.Select(item => item.Count).ToArray()),
                CreateChart(
                    "Users by Role",
                    "doughnut",
                    UserRoles,
                    usersByRole)
            ]);
    }

    private async Task<DashboardResponse> GetSupervisorDashboardAsync(
        Guid supervisorId,
        CancellationToken cancellationToken)
    {
        var assignedAssetCount = await db.AssetAssignments.AsNoTracking()
            .CountAsync(assignment => assignment.SupervisorId == supervisorId, cancellationToken);
        var assetStatuses = await GetAssetStatusesAsync(
            db.Assets.AsNoTracking().Where(asset =>
                db.AssetAssignments.Any(assignment =>
                    assignment.AssetId == asset.Id && assignment.SupervisorId == supervisorId)),
            cancellationToken);
        var tasks = db.MaintenanceTasks.AsNoTracking()
            .Where(task => task.SupervisorId == supervisorId);
        var taskStatuses = await GetTaskStatusesAsync(tasks, cancellationToken);
        var openTasks = taskStatuses.Values.Sum() - taskStatuses.GetValueOrDefault("Completed");
        var overdueTasks = await tasks.CountAsync(
            task => task.Status != "Completed" && task.DueAt < PhilippineStartOfTodayUtc(),
            cancellationToken);
        var assignedPersonnel = await db.PersonnelAssignments.AsNoTracking()
            .CountAsync(assignment =>
                assignment.SupervisorId == supervisorId &&
                assignment.Personnel.Role == "Personnel" &&
                assignment.Personnel.RevocationStatus != "Revoked",
                cancellationToken);

        return new DashboardResponse(
            "Supervisor",
            [
                new("Assigned Assets", assignedAssetCount.ToString(), "assets", "Under your supervision"),
                new("Assigned Personnel", assignedPersonnel.ToString(), "people", "Active team members"),
                new("Open Tasks", openTasks.ToString(), "tasks", "Pending or in progress"),
                new("Overdue Tasks", overdueTasks.ToString(), "alert", "Past their due date")
            ],
            [
                CreateChart("Assigned Assets by Status", "doughnut", AssetStatuses, assetStatuses),
                CreateChart("Maintenance Tasks", "bar", TaskStatuses, taskStatuses)
            ]);
    }

    private async Task<DashboardResponse> GetPersonnelDashboardAsync(
        Guid personnelId,
        CancellationToken cancellationToken)
    {
        var supervisorIds = db.PersonnelAssignments.AsNoTracking()
            .Where(assignment => assignment.PersonnelId == personnelId)
            .Select(assignment => assignment.SupervisorId);
        var assets = db.AssetAssignments.AsNoTracking()
            .Where(assignment => supervisorIds.Contains(assignment.SupervisorId));
        var assetStatuses = await GetAssetStatusesAsync(
            db.Assets.AsNoTracking().Where(asset =>
                assets.Any(assignment => assignment.AssetId == asset.Id)),
            cancellationToken);
        var tasks = db.MaintenanceTasks.AsNoTracking()
            .Where(task => task.Assignees.Any(assignee => assignee.PersonnelId == personnelId));
        var taskStatuses = await GetTaskStatusesAsync(tasks, cancellationToken);
        var totalTasks = taskStatuses.Values.Sum();
        var overdueTasks = await tasks.CountAsync(
            task => task.Status != "Completed" && task.DueAt < PhilippineStartOfTodayUtc(),
            cancellationToken);

        return new DashboardResponse(
            "Personnel",
            [
                new("Available Assets", assetStatuses.Values.Sum().ToString(), "assets", "Assigned to your supervisor"),
                new("Assigned Tasks", totalTasks.ToString(), "tasks", "Tasks assigned to you"),
                new("In Progress", taskStatuses.GetValueOrDefault("In Progress").ToString(), "wrench", "Tasks currently underway"),
                new("Overdue Tasks", overdueTasks.ToString(), "alert", "Past their due date")
            ],
            [
                CreateChart("Supervisor's Assets by Status", "doughnut", AssetStatuses, assetStatuses),
                CreateChart("Your Maintenance Tasks", "bar", TaskStatuses, taskStatuses)
            ]);
    }

    private static async Task<Dictionary<string, int>> GetAssetStatusesAsync(
        IQueryable<Assets> assets,
        CancellationToken cancellationToken)
    {
        var counts = await assets
            .GroupBy(asset => asset.Status)
            .Select(group => new { Label = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        return counts.ToDictionary(item => item.Label, item => item.Count);
    }

    private static async Task<Dictionary<string, int>> GetTaskStatusesAsync(
        IQueryable<MaintenanceTask> tasks,
        CancellationToken cancellationToken)
    {
        var counts = await tasks
            .GroupBy(task => task.Status)
            .Select(group => new { Label = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        return counts.ToDictionary(item => item.Label, item => item.Count);
    }

    private async Task<Dictionary<string, int>> GetUsersByRoleAsync(CancellationToken cancellationToken)
    {
        var counts = await db.Users.AsNoTracking()
            .Where(user => user.RevocationStatus != "Revoked")
            .GroupBy(user => user.Role)
            .Select(group => new { Label = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        return counts.ToDictionary(item => item.Label, item => item.Count);
    }

    private static DashboardChart CreateChart(
        string title,
        string chartType,
        IReadOnlyList<string> labels,
        IReadOnlyDictionary<string, int> values) =>
        new(title, chartType, labels, labels.Select(label => values.GetValueOrDefault(label)).ToArray());

    private static DateTimeOffset PhilippineStartOfTodayUtc()
    {
        var localNow = DateTimeOffset.UtcNow.ToOffset(PhilippineOffset);
        var localStart = new DateTimeOffset(localNow.Date, PhilippineOffset);
        return localStart.ToUniversalTime();
    }
}
