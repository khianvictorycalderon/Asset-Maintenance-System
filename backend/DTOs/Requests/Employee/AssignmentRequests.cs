using System.Text.Json.Serialization;

namespace backend.DTOs.Requests;

// POST api/employee/asset-assignments
public class AssignAssetsRequestDto
{
    // One or more assets to hand to the supervisor (max 100 per request)
    [JsonPropertyName("asset_ids")]
    public List<Guid>? AssetIds { get; set; }

    [JsonPropertyName("supervisor_id")]
    public Guid? SupervisorId { get; set; }
}

// POST api/employee/personnel-assignments
public class AssignPersonnelRequestDto
{
    // One or more personnel to place under the supervisor (max 100 per request)
    [JsonPropertyName("personnel_ids")]
    public List<Guid>? PersonnelIds { get; set; }

    [JsonPropertyName("supervisor_id")]
    public Guid? SupervisorId { get; set; }
}

// PUT api/employee/asset-assignments/{id}  and  PUT api/employee/personnel-assignments/{id}
// "Edit" = move the existing assignment to another supervisor.
public class UpdateAssignmentRequestDto
{
    [JsonPropertyName("supervisor_id")]
    public Guid? SupervisorId { get; set; }
}

// Query parameters shared by both assignment tables (search + filters + paging).
// Bound from the query string, e.g. ?keyword=cnc&supervisorId=...&startDate=2026-10-01&page=1&pageSize=5
public class GetAssignmentsQueryDto
{
    // Asset assignments: matches asset name OR asset tag.
    // Personnel assignments: matches personnel name OR username (email).
    public string? Keyword { get; set; }

    // "Supervisor" filter dropdown (null / omitted = all supervisors)
    public Guid? SupervisorId { get; set; }

    // "Assigned by" filter dropdown (null / omitted = all employees)
    public Guid? AssignedById { get; set; }

    // "Date assigned" range, inclusive (yyyy-MM-dd)
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
