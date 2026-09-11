using backend.Data;
using backend.Extensions;
using backend.Hubs;
using backend.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------------------
// Services
// ----------------------------------------------------------------
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddSignalR();

// ----------------------------------------------------------------
// App pipeline
// ----------------------------------------------------------------
var app = builder.Build();

// Db Seeder (auto creates the admin account if it doesn't exist)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, config);
}

app.UseCorsPolicy();
app.UseSessionAuth();

app.MapControllers();
// For real-time features
app.MapHub<SyncHub>("/hubs/sync");

app.MapGet("/", () => Results.Json(new { message = "Hello World from ASP.NET 🚀" }));

app.Run();