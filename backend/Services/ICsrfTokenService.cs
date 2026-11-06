namespace backend.Services;

public interface ICsrfTokenService
{
    /// <summary>
    /// Deterministically derives the CSRF token for a given session id.
    /// Nothing is stored anywhere — the same session id always
    /// recomputes to the same token (as long as Csrf:TokenKey stays the
    /// same), so this works identically across requests, restarts, and
    /// separate serverless invocations.
    /// </summary>
    string Compute(Guid sessionId);
}
