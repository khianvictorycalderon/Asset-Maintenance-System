using backend.DTOs;

public interface IAdminService
{
    Task<GetAllUserResponseDto> 
        GetAllUser(int page, int pageSize, string sortBy, string sortOrder);
}