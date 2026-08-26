namespace backend.DTOs.Responses;

public class LoginResponse
{
    public string Message { get; set; } = string.Empty;
    public UserBasicResponse? User { get; set; }
}

public class RegisterResponse
{
    public string Message { get; set; } = string.Empty;
    public UserBasicResponse? User { get; set; }
}

public class VerifyResponse
{
    public bool Authenticated { get; set; }
    public UserVerifyResponse? User { get; set; }
}

public class UserBasicResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class UserVerifyResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
