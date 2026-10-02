using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
namespace backend.Hubs;

public class SyncHub : Hub
{
    // Admins join this group so activity-log events only reach admins
    public const string AdminGroup = "Role_Admin";

    public override async Task OnConnectedAsync()
    {
        Console.WriteLine("SignalR connected");

        var userId = Context.User?.FindFirst("UserId")?.Value;
        var sessionId = Context.User?.FindFirst("SessionId")?.Value;

        // For debugging only
        // Console.WriteLine($"UserId: {userId}");

        if (userId != null)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"User_{userId}"
            );

            // For debugging only
            // Console.WriteLine($"Joined User_{userId}");
        }

        // Session-scoped group so a single revoked session can be force
        // logged-out in real time without affecting the user's other sessions
        if (sessionId != null)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"Session_{sessionId}"
            );
        }

        if (Context.User?.FindFirst(ClaimTypes.Role)?.Value == "Admin")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
        }

        await base.OnConnectedAsync();
    }
}