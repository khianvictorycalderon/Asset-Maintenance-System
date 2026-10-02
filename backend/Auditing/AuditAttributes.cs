namespace backend.Auditing;

/// <summary>
/// Put on any controller action to audit it with a friendly activity name,
/// e.g. [Audit("Fetch all users")]. Both successful and failed requests are logged.
/// Endpoints WITHOUT this attribute are only logged when they fail (401/403/4xx/5xx),
/// using "{METHOD} {route}" as the activity name.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class AuditAttribute(string activity) : Attribute
{
    public string Activity { get; } = activity;
}

/// <summary>Opt an endpoint out of auditing completely (e.g. noisy health checks).</summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class NoAuditAttribute : Attribute { }

/// <summary>
/// Per-request scratchpad. Services/filters can enrich the audit entry
/// (more specific activity name, details, affected user). Read by AuditMiddleware.
/// </summary>
public class AuditContext
{
    public string? Activity { get; set; }
    public string? Details { get; set; }
    public Guid? TargetUserId { get; set; }
}
