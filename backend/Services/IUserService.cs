using backend.DTOs.Requests;
using backend.DTOs.Responses;

namespace backend.Services;

public interface IUserService
{
    Task<UserProfileResponse?> GetMeAsync(Guid userId);
    Task<(bool Success, string? Error, int StatusCode)> UpdateProfileAsync(Guid userId, UpdateUserRequest request);
    Task<(bool Success, string? Error, int StatusCode)> UpdatePasswordAsync(Guid userId, UpdatePasswordRequest request);
    Task<(bool Success, string? Error, int StatusCode)> DeleteAccountAsync(Guid userId, DeleteAccountRequest request);
}
