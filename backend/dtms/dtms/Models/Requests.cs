using System.ComponentModel.DataAnnotations;

namespace dtms.Models;

/// <summary>
/// Create payload for a distributor. Id/Code/JoinedAt/AvatarColor are
/// generated server-side when omitted (mirrors the frontend addDistributor).
/// </summary>
public class DistributorCreateRequest
{
    [Required] public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Status { get; set; }          // active | inactive | pending
    public string? Code { get; set; }            // optional override
    public string? JoinedAt { get; set; }        // optional override (yyyy-MM-dd)
    public string? AvatarColor { get; set; }     // optional override
}

public class DistributorUpdateRequest
{
    [Required] public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? JoinedAt { get; set; }
    public string? Status { get; set; }
    public string? AvatarColor { get; set; }
}

/// <summary>
/// Create payload for a territory. Sales/performance/outlets/color are
/// generated server-side when omitted (mirrors the frontend addTerritory).
/// </summary>
public class TerritoryCreateRequest
{
    [Required] public string Name { get; set; } = string.Empty;
    public string CoverageArea { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Color { get; set; }

    [Required] public List<double[]> Coordinates { get; set; } = new();

    public string? DistributorId { get; set; }
    public decimal? MonthlySales { get; set; }
    public decimal? TargetSales { get; set; }
    public string? Performance { get; set; }
    public int? Outlets { get; set; }
}

public class TerritoryUpdateRequest
{
    [Required] public string Name { get; set; } = string.Empty;
    public string CoverageArea { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Color { get; set; }

    /// <summary>When null/empty the existing polygon is kept.</summary>
    public List<double[]>? Coordinates { get; set; }

    public string? DistributorId { get; set; }
    public decimal? MonthlySales { get; set; }
    public decimal? TargetSales { get; set; }
    public string? Performance { get; set; }
    public int? Outlets { get; set; }
}

/// <summary>Replace a territory's polygon vertices.</summary>
public class CoordinatesUpdateRequest
{
    [Required] public List<double[]> Coordinates { get; set; } = new();
}

/// <summary>Assign (or clear, when DistributorId is null) a territory.</summary>
public class AssignRequest
{
    public string? DistributorId { get; set; }
}
