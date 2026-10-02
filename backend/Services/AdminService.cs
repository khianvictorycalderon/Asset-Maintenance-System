using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public class AdminService(AppDbContext db) : IAdminService
{
    private readonly AppDbContext _db = db;
    
    public async Task<GetAllUserResponseDto> GetAllUser
    (
        int page = 1,
        int pageSize = 10,
        string sortBy = "lastname",
        string sortOrder = "asc"
    )
    {

        var query = _db.Users.AsNoTracking();

        query = sortBy.ToLower() switch
        {
            "firstname" => sortOrder == "desc"
                ? query.OrderByDescending(u => u.FirstName)
                : query.OrderBy(u => u.FirstName),

            "lastname" => sortOrder == "desc"
                ? query.OrderByDescending(u => u.LastName)
                : query.OrderBy(u => u.LastName),

            "email" => sortOrder == "desc"
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),

            "createdat" => sortOrder == "desc"
                ? query.OrderByDescending(u => u.UpdatedAt)
                : query.OrderBy(u => u.UpdatedAt),

            _ => query.OrderBy(u => u.UpdatedAt)
        };

        var totalUsers = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AllUsersDto
            {
                UserId = u.Id.ToString(),
                FirstName = u.FirstName,
                MiddleName = u.MiddleName ?? "",
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role,
                RevocationStatus = u.RevocationStatus
            })
            .ToListAsync();

        return new GetAllUserResponseDto
        {
            Message = "User retrieved successfully.",
            Users = users,
            UserCount = totalUsers
        };
    }

    public async Task<UpdateRevocationAccessResponseDto> UpdateRevocationStatus
    (
        Guid userId
    )
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var isUserBanned = user.RevocationStatus != "Revoked";

        user.RevocationStatus = isUserBanned
            ? "Revoked"
            : "Active";

        await _db.SaveChangesAsync();

        // TODO: Record the action in the System Activity Logs.

        return new UpdateRevocationAccessResponseDto
        {
            IsUserBanned = isUserBanned,
            Message = isUserBanned
                ? "User access revoked successfully."
                : "User access restored successfully."
        };
    }
}