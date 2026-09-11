using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        IConfiguration configuration
    ){

        var adminDefaultEmail = configuration.GetSection("Default:Credentials:Admin:Username").Get<string>();
        var adminDefaultPassword = configuration.GetSection("Default:Credentials:Admin:Password").Get<string>();
        
        if (string.IsNullOrWhiteSpace(adminDefaultEmail) || string.IsNullOrWhiteSpace(adminDefaultPassword))
            throw new InvalidOperationException("Default admin credentials are not set!");

        // Check if there is already an existing admin
        var isAdminExist = await db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Role == "Admin");
        if (isAdminExist) {
            Console.WriteLine("Admin already exists, no need to create admin with default admin credentials!");
            return;
        }

        var adminHashedPassword = BCrypt.Net.BCrypt.HashPassword(adminDefaultPassword, workFactor: 10);

        var admin = new User
        {
            FirstName    = "System",
            MiddleName   = null,
            LastName     = "Admin",
            BirthDate    = new DateOnly(2000, 1, 1),
            Email        = adminDefaultEmail,
            PasswordHash = adminHashedPassword,
            Role         = "Admin" 
        };

        // Save to database
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        Console.WriteLine("Default admin account created!");
    }
}