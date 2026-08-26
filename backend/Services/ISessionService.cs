using backend.DTOs.Responses;

namespace backend.Services;

public interface ISessionService
{
    Task<SessionsListResponse> GetSessionsAsync(Guid userId, Guid? currentSessionId, int page);
    Task<(bool Success, string? Error, int StatusCode)> RevokeSessionAsync(Guid userId, Guid sessionId, Guid? currentSessionId);
    Task<(bool Success, string? Error, int StatusCode)> RevokeAllOtherSessionsAsync(Guid userId, Guid? currentSessionId);
}
