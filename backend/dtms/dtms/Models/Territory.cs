namespace dtms.Models;

/// <summary>
/// Mirrors the frontend Territory interface (types/index.ts).
/// Coordinates are LatLng tuples => [lat, lng]; serialized as number[][].
/// </summary>
public class Territory
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CoverageArea { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Color { get; set; } = "#6366f1";

    /// <summary>[lat, lng] pairs forming the polygon ring.</summary>
    public List<double[]> Coordinates { get; set; } = new();

    public string? DistributorId { get; set; }

    /// <summary>ISO datetime string.</summary>
    public string CreatedAt { get; set; } = string.Empty;

    public decimal MonthlySales { get; set; }
    public decimal TargetSales { get; set; }

    /// <summary>excellent | good | average | underperforming</summary>
    public string Performance { get; set; } = "average";

    public int Outlets { get; set; }
}
