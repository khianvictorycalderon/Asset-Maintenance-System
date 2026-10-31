namespace backend.DTOs.Responses;

/// <summary>Dashboard data tailored to the authenticated user's role.</summary>
public sealed record DashboardResponse(
    string Role,
    IReadOnlyList<DashboardMetric> Metrics,
    IReadOnlyList<DashboardChart> Charts);

/// <summary>A dashboard statistic and its display metadata.</summary>
public sealed record DashboardMetric(
    string Title,
    string Value,
    string Icon,
    string? Trend);

/// <summary>A dashboard chart containing labels and their corresponding values.</summary>
public sealed record DashboardChart(
    string Title,
    string ChartType,
    IReadOnlyList<string> Labels,
    IReadOnlyList<int> Values);
