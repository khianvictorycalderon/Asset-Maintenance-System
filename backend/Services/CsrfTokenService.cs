using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

public class CsrfTokenService : ICsrfTokenService
{
    private readonly byte[] _key;

    public CsrfTokenService(IConfiguration configuration)
    {
        var configuredKey = configuration["Csrf:TokenKey"];

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            // Fail loudly at startup rather than silently issuing/accepting
            // predictable (or empty-key) tokens.
            throw new InvalidOperationException(
                "Csrf:TokenKey is not configured. Add a long random string to appsettings.Development.json."
            );
        }

        _key = Encoding.UTF8.GetBytes(configuredKey);
    }

    public string Compute(Guid sessionId)
    {
        using var hmac = new HMACSHA256(_key);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(sessionId.ToString()));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
