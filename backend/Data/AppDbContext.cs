using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

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
      }

      protected override void ConfigureConventions(
            ModelConfigurationBuilder configurationBuilder)
      {
      configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();
      }
}
