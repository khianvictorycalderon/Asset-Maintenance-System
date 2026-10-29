using System.Text.Json.Serialization;

namespace backend.DTOs.Requests;

public class ChangePasswordRequestDto
{
    // confirm_password is frontend-only and intentionally NOT part of this DTO
    [JsonPropertyName("new_password")]
    public string? NewPassword { get; set; }
}
