namespace backend.DTOs;

public class GetAllUserResponseDto
{
    public string Message { get; set; } = "";
    public List<AllUsersDto> Users { get; set; } = [];
    public int UserCount { get; set; } = 0;
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
}