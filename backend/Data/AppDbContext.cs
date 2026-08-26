using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();

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
      }

      protected override void ConfigureConventions(
            ModelConfigurationBuilder configurationBuilder)
      {
      configurationBuilder
            .Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();
      }
}
