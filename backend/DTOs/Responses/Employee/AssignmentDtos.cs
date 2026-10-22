using System.Linq.Expressions;
using backend.Models;

namespace backend.DTOs;

// ==================================================================================================================
// Shared dropdown options
// ==================================================================================================================

// A user the Employee can pick as supervisor (also used by the "Supervisor" filter and the Edit modal)
public class SupervisorOptionDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    // The app has no separate username: the account email is the username
    public string Username { get; set; } = string.Empty;
    public bool IsRevoked { get; set; }
}

public class GetSupervisorOptionsResponseDto
{
    public string Message { get; set; } = "";
    public List<SupervisorOptionDto> Supervisors { get; set; } = [];
}

// An Employee/Admin who has made at least one assignment ("Assigned by" filter)
public class AssignerOptionDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}

public class GetAssignerOptionsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssignerOptionDto> Assigners { get; set; } = [];
}

// ==================================================================================================================
// Asset assignments
// ==================================================================================================================

// A row of the "Employee Assets Assignment" table
public class AssetAssignmentDto
{
    public Guid Id { get; set; }                       // assignment id (use for Edit / Delete)
    public Guid AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string AssetTag { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid SupervisorId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string SupervisorUsername { get; set; } = string.Empty;
    public Guid? AssignedById { get; set; }
    public string? AssignedBy { get; set; }            // null only if that account no longer exists
    public DateOnly DateAssigned { get; set; }

    public static readonly Expression<Func<AssetAssignment, AssetAssignmentDto>> Projection = a => new AssetAssignmentDto
    {
        Id = a.Id,
        AssetId = a.AssetId,
        AssetName = a.Asset.Name,
        AssetTag = a.Asset.Tag,
        Category = a.Asset.Category,
        SupervisorId = a.SupervisorId,
        SupervisorName = a.Supervisor.FirstName + " " + a.Supervisor.LastName,
        SupervisorUsername = a.Supervisor.Email,
        AssignedById = a.AssignedById,
        AssignedBy = a.AssignedBy == null ? null : a.AssignedBy.FirstName + " " + a.AssignedBy.LastName,
        DateAssigned = a.DateAssigned
    };

    private static readonly Func<AssetAssignment, AssetAssignmentDto> Compiled = Projection.Compile();

    public static AssetAssignmentDto From(AssetAssignment a) => Compiled(a);
}

public class GetAssetAssignmentsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssetAssignmentDto> Assignments { get; set; } = [];
    public int TotalAssignments { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

// One entry of the "Asset" multi-select
public class AssetOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Tag { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    // true => already has a supervisor: render greyed out / disabled (use Edit to move it)
    public bool IsAssigned { get; set; }
    public string? AssignedTo { get; set; }
}

public class GetAssetOptionsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssetOptionDto> Assets { get; set; } = [];
    // Total matches before the limit was applied (lets the UI show "refine your search")
    public int TotalAssets { get; set; }
}

public class AssignAssetsResponseDto
{
    public string Message { get; set; } = "";
    public List<AssetAssignmentDto> Assignments { get; set; } = [];
}

public class AssetAssignmentResponseDto
{
    public string Message { get; set; } = "";
    public AssetAssignmentDto Assignment { get; set; } = new();
}

// ==================================================================================================================
// Personnel assignments
// ==================================================================================================================

// A row of the "Assign Personnel" table
public class PersonnelAssignmentDto
{
    public Guid Id { get; set; }                       // assignment id (use for Edit / Delete)
    public Guid PersonnelId { get; set; }
    public string PersonnelName { get; set; } = string.Empty;
    public string PersonnelUsername { get; set; } = string.Empty;
    public Guid SupervisorId { get; set; }
    public string SupervisorName { get; set; } = string.Empty;
    public string SupervisorUsername { get; set; } = string.Empty;
    public Guid? AssignedById { get; set; }
    public string? AssignedBy { get; set; }            // null only if that account no longer exists
    public DateOnly DateAssigned { get; set; }

    public static readonly Expression<Func<PersonnelAssignment, PersonnelAssignmentDto>> Projection = a => new PersonnelAssignmentDto
    {
        Id = a.Id,
        PersonnelId = a.PersonnelId,
        PersonnelName = a.Personnel.FirstName + " " + a.Personnel.LastName,
        PersonnelUsername = a.Personnel.Email,
        SupervisorId = a.SupervisorId,
        SupervisorName = a.Supervisor.FirstName + " " + a.Supervisor.LastName,
        SupervisorUsername = a.Supervisor.Email,
        AssignedById = a.AssignedById,
        AssignedBy = a.AssignedBy == null ? null : a.AssignedBy.FirstName + " " + a.AssignedBy.LastName,
        DateAssigned = a.DateAssigned
    };

    private static readonly Func<PersonnelAssignment, PersonnelAssignmentDto> Compiled = Projection.Compile();

    public static PersonnelAssignmentDto From(PersonnelAssignment a) => Compiled(a);
}

public class GetPersonnelAssignmentsResponseDto
{
    public string Message { get; set; } = "";
    public List<PersonnelAssignmentDto> Assignments { get; set; } = [];
    public int TotalAssignments { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

// One entry of the "Personnel" multi-select
public class PersonnelOptionDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    // true => already has a supervisor: render greyed out / disabled (use Edit to move them)
    public bool IsAssigned { get; set; }
    public string? AssignedTo { get; set; }
}

public class GetPersonnelOptionsResponseDto
{
    public string Message { get; set; } = "";
    public List<PersonnelOptionDto> Personnel { get; set; } = [];
    public int TotalPersonnel { get; set; }
}

public class AssignPersonnelResponseDto
{
    public string Message { get; set; } = "";
    public List<PersonnelAssignmentDto> Assignments { get; set; } = [];
}

public class PersonnelAssignmentResponseDto
{
    public string Message { get; set; } = "";
    public PersonnelAssignmentDto Assignment { get; set; } = new();
}
