using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("maintenance_tasks")]
public class MaintenanceTask
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("supervisor_id")]
    public Guid SupervisorId { get; set; }

    [Column("assigned_by")]
    public Guid? AssignedById { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("due_at")]
    public DateTimeOffset DueAt { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(SupervisorId))]
    public User Supervisor { get; set; } = null!;

    [ForeignKey(nameof(AssignedById))]
    public User? AssignedBy { get; set; }

    public ICollection<MaintenanceTaskAssignee> Assignees { get; set; } = [];
}

[Table("maintenance_task_assignees")]
public class MaintenanceTaskAssignee
{
    [Column("task_id")]
    public Guid TaskId { get; set; }

    [Column("personnel_id")]
    public Guid PersonnelId { get; set; }

    [ForeignKey(nameof(TaskId))]
    public MaintenanceTask Task { get; set; } = null!;

    [ForeignKey(nameof(PersonnelId))]
    public User Personnel { get; set; } = null!;
}
