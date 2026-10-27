using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Assets> Assets => Set<Assets>();
    public DbSet<AssetAssignment> AssetAssignments => Set<AssetAssignment>();
    public DbSet<PersonnelAssignment> PersonnelAssignments => Set<PersonnelAssignment>();
    public DbSet<MaintenanceTask> MaintenanceTasks => Set<MaintenanceTask>();
    public DbSet<MaintenanceTaskAssignee> MaintenanceTaskAssignees => Set<MaintenanceTaskAssignee>();

      protected override void OnModelCreating(ModelBuilder modelBuilder)
      {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                  entity.HasIndex(u => u.Email).IsUnique();

                  entity.Property(u => u.Role)
                        .HasDefaultValue("Employee");

                  entity.Property(u => u.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(u => u.UpdatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(u => u.RevocationStatus)
                        .HasDefaultValue("Active");
            });

            // Session
            modelBuilder.Entity<Session>(entity =>
            {
                  entity.HasOne(s => s.User)
                        .WithMany(u => u.Sessions)
                        .HasForeignKey(s => s.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.Property(s => s.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(s => s.LastSeen)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");
            });

            // Activity Log
            modelBuilder.Entity<ActivityLog>(entity =>
            {
                  entity.HasOne(log => log.PerformedBy)
                        .WithMany()
                        .HasForeignKey(log => log.PerformedById)
                        .OnDelete(DeleteBehavior.SetNull);

                  entity.HasOne(log => log.TargetUser)
                        .WithMany()
                        .HasForeignKey(log => log.TargetUserId)
                        .OnDelete(DeleteBehavior.SetNull);

                  entity.HasIndex(log => log.Timestamp);

                  entity.Property(log => log.Timestamp)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(log => log.DatePerformed)
                        .HasDefaultValueSql("CURRENT_DATE");
            });

            // Assets (asset registry)
            modelBuilder.Entity<Assets>(entity =>
            {
                  // Backstop for the case-insensitive duplicate check done in EmployeeService
                  entity.HasIndex(a => a.Tag).IsUnique();
                  entity.HasIndex(a => a.DateAdded);

                  entity.Property(a => a.Status)
                        .HasDefaultValue("Active");

                  entity.Property(a => a.Condition)
                        .HasDefaultValue("Good");

                  entity.Property(a => a.Criticality)
                        .HasDefaultValue("Medium");

                  entity.Property(a => a.DateAdded)
                        .HasDefaultValueSql("CURRENT_DATE");

                  entity.Property(a => a.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(a => a.UpdatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");
            });

            // Asset assignments (asset -> supervisor)
            modelBuilder.Entity<AssetAssignment>(entity =>
            {
                  // One supervisor per asset; deleting an asset removes its assignment
                  entity.HasIndex(a => a.AssetId).IsUnique();
                  entity.HasIndex(a => a.SupervisorId);
                  entity.HasIndex(a => a.DateAssigned);

                  entity.HasOne(a => a.Asset)
                        .WithMany()
                        .HasForeignKey(a => a.AssetId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(a => a.Supervisor)
                        .WithMany()
                        .HasForeignKey(a => a.SupervisorId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(a => a.AssignedBy)
                        .WithMany()
                        .HasForeignKey(a => a.AssignedById)
                        .OnDelete(DeleteBehavior.SetNull);

                  entity.Property(a => a.DateAssigned)
                        .HasDefaultValueSql("CURRENT_DATE");

                  entity.Property(a => a.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(a => a.UpdatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");
            });

            // Personnel assignments (personnel -> supervisor)
            modelBuilder.Entity<PersonnelAssignment>(entity =>
            {
                  // One supervisor per personnel
                  entity.HasIndex(a => a.PersonnelId).IsUnique();
                  entity.HasIndex(a => a.SupervisorId);
                  entity.HasIndex(a => a.DateAssigned);

                  entity.HasOne(a => a.Personnel)
                        .WithMany()
                        .HasForeignKey(a => a.PersonnelId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(a => a.Supervisor)
                        .WithMany()
                        .HasForeignKey(a => a.SupervisorId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(a => a.AssignedBy)
                        .WithMany()
                        .HasForeignKey(a => a.AssignedById)
                        .OnDelete(DeleteBehavior.SetNull);

                  entity.Property(a => a.DateAssigned)
                        .HasDefaultValueSql("CURRENT_DATE");

                  entity.Property(a => a.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(a => a.UpdatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");
            });

            modelBuilder.Entity<MaintenanceTask>(entity =>
            {
                  entity.HasIndex(t => new { t.SupervisorId, t.DueAt });
                  entity.HasIndex(t => t.Status);

                  entity.HasOne(t => t.Supervisor)
                        .WithMany()
                        .HasForeignKey(t => t.SupervisorId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(t => t.AssignedBy)
                        .WithMany()
                        .HasForeignKey(t => t.AssignedById)
                        .OnDelete(DeleteBehavior.SetNull);

                  entity.Property(t => t.Status)
                        .HasDefaultValue("Pending");

                  entity.Property(t => t.CreatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");

                  entity.Property(t => t.UpdatedAt)
                        .HasDefaultValueSql("TIMEZONE('UTC', NOW())");
            });

            modelBuilder.Entity<MaintenanceTaskAssignee>(entity =>
            {
                  entity.HasKey(a => new { a.TaskId, a.PersonnelId });
                  entity.HasIndex(a => a.PersonnelId);

                  entity.HasOne(a => a.Task)
                        .WithMany(t => t.Assignees)
                        .HasForeignKey(a => a.TaskId)
                        .OnDelete(DeleteBehavior.Cascade);

                  entity.HasOne(a => a.Personnel)
                        .WithMany()
                        .HasForeignKey(a => a.PersonnelId)
                        .OnDelete(DeleteBehavior.Cascade);
            });
      }

      protected override void ConfigureConventions(
            ModelConfigurationBuilder configurationBuilder)
      {
      configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();
      }
}
