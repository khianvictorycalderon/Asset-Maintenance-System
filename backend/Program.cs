using backend.Extensions;
using backend.Hubs;
using backend.Middleware;

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

app.UseCorsPolicy();
app.UseSessionAuth();

app.MapControllers();
// For real-time features
app.MapHub<SyncHub>("/hubs/sync");

app.MapGet("/", () => Results.Json(new { message = "Hello World from ASP.NET 🚀" }));

app.Run();
