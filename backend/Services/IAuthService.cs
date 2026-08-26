using backend.DTOs.Requests;
using backend.DTOs.Responses;

namespace backend.Services;

public interface IAuthService
{
    Task<(LoginResponse? Response, Guid? SessionId, DateTime? ExpiresAt, string? Error, int StatusCode)>
        LoginAsync(LoginRequest request, string? ip, string? userAgent);

    Task<(RegisterResponse? Response, string? Error, int StatusCode)>
        RegisterAsync(RegisterRequest request);

    Task<VerifyResponse> VerifyAsync(Guid? sessionId);

    Task<bool> LogoutAsync(Guid? sessionId);
}
