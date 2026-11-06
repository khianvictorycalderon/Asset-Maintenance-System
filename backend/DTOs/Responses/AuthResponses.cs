namespace backend.DTOs.Responses;

public class LoginResponse
{
    public string Message { get; set; } = string.Empty;
    public UserBasicResponse? User { get; set; }
    // Anti-CSRF token for the session just created. The frontend stores
    // this in memory and echoes it back via X-CSRF-TOKEN on every
    // POST/PUT/PATCH/DELETE request (see frontend/src/utils/csrf.ts).
    public string? CsrfToken { get; set; }
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
    // Re-handed out on every /api/verify call so a full page reload (or
    // an app that lost its in-memory copy) can recover the current
    // session's CSRF token without needing to log in again.
    public string? CsrfToken { get; set; }
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
