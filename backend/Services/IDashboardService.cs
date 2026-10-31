using backend.DTOs.Responses;

namespace backend.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetDashboardAsync(
        Guid userId,
        string role,
        CancellationToken cancellationToken);
}
