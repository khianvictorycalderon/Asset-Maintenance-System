using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// An asset handed to a Supervisor to manage. An asset can only have ONE supervisor at a time
/// (unique index on asset_id) - to move it, edit the existing assignment.
/// </summary>
[Table("asset_assignments")]
public class AssetAssignment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("asset_id")]
    public Guid AssetId { get; set; }

    // The user (role = Supervisor) responsible for the asset
    [Column("supervisor_id")]
    public Guid SupervisorId { get; set; }

    // The Employee who made (or last changed) the assignment. Null only if that user was removed.
    [Column("assigned_by")]
    public Guid? AssignedById { get; set; }

    [Column("date_assigned")]
    public DateOnly DateAssigned { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(AssetId))]
    public Assets Asset { get; set; } = null!;

    [ForeignKey(nameof(SupervisorId))]
    public User Supervisor { get; set; } = null!;

    [ForeignKey(nameof(AssignedById))]
    public User? AssignedBy { get; set; }
}
