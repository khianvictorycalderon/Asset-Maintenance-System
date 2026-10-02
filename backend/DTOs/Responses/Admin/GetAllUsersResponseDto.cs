namespace backend.DTOs;

public class GetAllUserResponseDto
{
    public string Message { get; set; } = "";
    public List<AllUsersDto> Users { get; set; } = [];
    public int TotalUsers { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class AllUsersDto
{
    public required string UserId { get; set; }
    public required string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public required string RevocationStatus { get; set; }
    public bool IsUserBanned { get; set; }
}
