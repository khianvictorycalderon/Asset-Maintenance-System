using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("sessions")]
public class Session
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [MaxLength(100)]
    [Column("ip")]
    public string? Ip { get; set; }

    [Column("user_agent")]
    public string? UserAgent { get; set; }

    [MaxLength(100)]
    [Column("browser")]
    public string? Browser { get; set; }

    [MaxLength(100)]
    [Column("os")]
    public string? Os { get; set; }

    [MaxLength(100)]
    [Column("device")]
    public string? Device { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_seen")]
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    // Navigation
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
