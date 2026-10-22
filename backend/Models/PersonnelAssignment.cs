using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// A Personnel user placed under a Supervisor. A personnel can only have ONE supervisor at a time
/// (unique index on personnel_id) - to move them, edit the existing assignment.
/// </summary>
[Table("personnel_assignments")]
public class PersonnelAssignment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    // The user (role = Personnel) being assigned
    [Column("personnel_id")]
    public Guid PersonnelId { get; set; }

    // The user (role = Supervisor) they report to
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
    [ForeignKey(nameof(PersonnelId))]
    public User Personnel { get; set; } = null!;

    [ForeignKey(nameof(SupervisorId))]
    public User Supervisor { get; set; } = null!;

    [ForeignKey(nameof(AssignedById))]
    public User? AssignedBy { get; set; }
}
