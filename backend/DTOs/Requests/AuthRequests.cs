using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTOs.Requests;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    [Required]
    [MaxLength(30)]
    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(30)]
    [JsonPropertyName("middle_name")]
    public string? MiddleName { get; set; }

    [Required]
    [MaxLength(30)]
    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("birth_date")]
    public DateOnly BirthDate { get; set; }

    [Required]
    [EmailAddress]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [JsonPropertyName("confirm_password")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = "Employee";
}
