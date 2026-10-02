using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("activity_logs")]
public class ActivityLog
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    [Column("activity")]
    public string Activity { get; set; } = string.Empty;

    [Column("performed_by")]
    public Guid? PerformedById { get; set; }

    [Required]
    [MaxLength(30)]
    [Column("result")]
    public string Result { get; set; } = string.Empty;

    [Column("date_performed")]
    public DateOnly DatePerformed { get; set; }
        = DateOnly.FromDateTime(DateTime.UtcNow);

    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Affected user (e.g. whose role/password/access was changed), when applicable
    [Column("target_user_id")]
    public Guid? TargetUserId { get; set; }

    // Only stored when there is NO identifiable authenticated actor
    [MaxLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    // Human readable explanation (never contains passwords)
    [MaxLength(500)]
    [Column("details")]
    public string? Details { get; set; }

    // Navigation
    [ForeignKey(nameof(PerformedById))]
    public User? PerformedBy { get; set; }

    [ForeignKey(nameof(TargetUserId))]
    public User? TargetUser { get; set; }
}