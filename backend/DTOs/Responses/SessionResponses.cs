namespace backend.DTOs.Responses;

public class SessionResponse
{
    public Guid Id { get; set; }
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
    public string? Browser { get; set; }
    public string? Os { get; set; }
    public string? Device { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastSeen { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsCurrent { get; set; }
}

public class PaginationResponse
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
}

public class SessionsListResponse
{
    public List<SessionResponse> Sessions { get; set; } = [];
    public PaginationResponse Pagination { get; set; } = new();
}
