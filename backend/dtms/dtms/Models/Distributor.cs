namespace dtms.Models;

/// <summary>
/// Mirrors the frontend Distributor interface (types/index.ts).
/// JSON is serialized camelCase via the API's JsonSerializerOptions.
/// </summary>
public class Distributor
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }

    /// <summary>ISO date (yyyy-MM-dd) as the frontend expects.</summary>
    public string JoinedAt { get; set; } = string.Empty;

    /// <summary>active | inactive | pending</summary>
    public string Status { get; set; } = "active";

    public string? AvatarColor { get; set; }

    /// <summary>Derived: the territory whose DistributorId points at this distributor.</summary>
    public string? AssignedTerritoryId { get; set; }
}
