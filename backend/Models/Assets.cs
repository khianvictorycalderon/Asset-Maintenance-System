using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("assets")]
public class Assets
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    // Unique, compared case-insensitively (enforced in AdminService + unique index)
    [Required]
    [MaxLength(50)]
    [Column("tag")]
    public string Tag { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    // Active | Inactive | Under Maintenance
    [Required]
    [MaxLength(30)]
    [Column("status")]
    public string Status { get; set; } = "Active";

    // Good | Fair | Poor | Damaged
    [Required]
    [MaxLength(20)]
    [Column("condition")]
    public string Condition { get; set; } = "Good";

    // Workshop Equipment | Office Equipment | IT Equipment | Machinery | Vehicles | Tools | Other
    [Required]
    [MaxLength(50)]
    [Column("category")]
    public string Category { get; set; } = string.Empty;

    // Low | Medium | High | Critical
    [Required]
    [MaxLength(20)]
    [Column("criticality")]
    public string Criticality { get; set; } = "Medium";

    [Column("date_added")]
    public DateOnly DateAdded { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
