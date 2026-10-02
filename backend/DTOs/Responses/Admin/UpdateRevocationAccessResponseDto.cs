namespace backend.DTOs;
using System.Text.Json.Serialization;

public class UpdateRevocationAccessResponseDto
{
    [JsonPropertyName("is_user_banned")]
    public bool IsUserBanned { get; set; }
    public string Message { get; set; } = string.Empty;
}