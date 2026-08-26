using Microsoft.AspNetCore.SignalR;
namespace backend.Hubs;

public class SyncHub : Hub
{
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

        await base.OnConnectedAsync();
    }
}