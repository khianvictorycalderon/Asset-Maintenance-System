using backend.DTOs;
using backend.DTOs.Requests;

public interface IAdminService
{
    Task<GetAllUserResponseDto> GetAllUser(int page, int pageSize);

    Task<UpdateRevocationAccessResponseDto> UpdateRevocationStatus(Guid userId);

    Task<UpdateRoleResponseDto> UpdateRole(Guid userId, UpdateRoleRequestDto request);

    Task<string> ChangePassword(Guid userId, ChangePasswordRequestDto request, Guid actorId, Guid? currentSessionId);

    Task<GetActivityLogsResponseDto> GetActivityLogs(int page, int pageSize);
}
