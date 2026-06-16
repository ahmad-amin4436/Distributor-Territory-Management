using dtms.Models;
using dtms.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace dtms.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TerritoriesController : ControllerBase
{
    private static readonly string[] TerritoryColors =
        { "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6", "#ef4444" };

    private readonly ITerritoryRepository _repo;

    public TerritoriesController(ITerritoryRepository repo) => _repo = repo;

    /// <summary>List all territories with their polygon coordinates.</summary>
    [HttpGet]
    public ActionResult<IEnumerable<Territory>> GetAll() => Ok(_repo.GetAll());

    /// <summary>Get a single territory.</summary>
    [HttpGet("{id}")]
    public ActionResult<Territory> GetById(string id)
    {
        var territory = _repo.GetById(id);
        return territory is null ? NotFound() : Ok(territory);
    }

    /// <summary>
    /// Create a territory. Mirrors the frontend addTerritory: when sales /
    /// performance / outlets / color are not supplied they are generated.
    /// </summary>
    [HttpPost]
    public ActionResult<Territory> Create([FromBody] TerritoryCreateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (request.Coordinates is null || request.Coordinates.Count < 3)
            return BadRequest("A territory needs at least 3 coordinate points.");

        var existing = _repo.GetAll();

        var color = request.Color;
        if (string.IsNullOrWhiteSpace(color))
        {
            var used = existing.Select(t => t.Color).ToHashSet(StringComparer.OrdinalIgnoreCase);
            color = TerritoryColors.FirstOrDefault(c => !used.Contains(c))
                    ?? TerritoryColors[existing.Count % TerritoryColors.Length];
        }

        var monthlySales = request.MonthlySales ?? 0;
        var targetSales = request.TargetSales ?? 0;
        var performance = PerformanceFromRatio((double)monthlySales, (double)targetSales);
        var outlets = request.Outlets ?? 0;

        var territory = new Territory
        {
            Id = $"t-{DateTime.UtcNow.Ticks:x}",
            Name = request.Name,
            CoverageArea = request.CoverageArea,
            Notes = request.Notes,
            Color = color!,
            Coordinates = request.Coordinates,
            DistributorId = request.DistributorId,
            CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            MonthlySales = monthlySales,
            TargetSales = targetSales,
            Performance = performance,
            Outlets = outlets,
            Population = request.Population ?? 0,
        };

        var created = _repo.Insert(territory);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Update a territory. Omitting coordinates keeps the existing polygon.</summary>
    [HttpPut("{id}")]
    public ActionResult<Territory> Update(string id, [FromBody] TerritoryUpdateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var current = _repo.GetById(id);
        if (current is null) return NotFound();

        current.Name = request.Name;
        current.CoverageArea = request.CoverageArea;
        current.Notes = request.Notes;
        current.Color = request.Color ?? current.Color;
        current.DistributorId = request.DistributorId;
        current.MonthlySales = request.MonthlySales ?? current.MonthlySales;
        current.TargetSales = request.TargetSales ?? current.TargetSales;
        current.Outlets = request.Outlets ?? current.Outlets;
        current.Population = request.Population ?? current.Population;
        // Recompute performance from the (possibly updated) sales/target unless
        // the client explicitly supplied a performance value.
        current.Performance = request.Performance
            ?? PerformanceFromRatio((double)current.MonthlySales, (double)current.TargetSales);

        var replaceCoordinates = request.Coordinates is { Count: >= 3 };
        if (replaceCoordinates) current.Coordinates = request.Coordinates!;

        var updated = _repo.Update(current, replaceCoordinates);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Replace a territory's polygon vertices (drag/redraw on the map).</summary>
    [HttpPut("{id}/coordinates")]
    public ActionResult<Territory> UpdateCoordinates(string id, [FromBody] CoordinatesUpdateRequest request)
    {
        if (request.Coordinates is null || request.Coordinates.Count < 3)
            return BadRequest("A territory needs at least 3 coordinate points.");

        var updated = _repo.UpdateCoordinates(id, request.Coordinates);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Assign (or clear, when distributorId is null) the territory's distributor.</summary>
    [HttpPut("{id}/assign")]
    public ActionResult<Territory> Assign(string id, [FromBody] AssignRequest request)
    {
        var updated = _repo.Assign(id, request.DistributorId);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Delete a territory (coordinates cascade-delete).</summary>
    [HttpDelete("{id}")]
    public IActionResult Delete(string id) =>
        _repo.Delete(id) ? NoContent() : NotFound();

    private static string PerformanceFromRatio(double sales, double target)
    {
        if (target == 0) return "average";
        var r = sales / target;
        if (r >= 1) return "excellent";
        if (r >= 0.85) return "good";
        if (r >= 0.65) return "average";
        return "underperforming";
    }
}
