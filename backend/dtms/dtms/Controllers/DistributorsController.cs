using dtms.Models;
using dtms.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace dtms.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DistributorsController : ControllerBase
{
    private static readonly string[] Palette =
        { "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6", "#ef4444" };

    private readonly IDistributorRepository _repo;

    public DistributorsController(IDistributorRepository repo) => _repo = repo;

    /// <summary>List all distributors (with derived assignedTerritoryId).</summary>
    [HttpGet]
    public ActionResult<IEnumerable<Distributor>> GetAll() => Ok(_repo.GetAll());

    /// <summary>Get a single distributor.</summary>
    [HttpGet("{id}")]
    public ActionResult<Distributor> GetById(string id)
    {
        var distributor = _repo.GetById(id);
        return distributor is null ? NotFound() : Ok(distributor);
    }

    /// <summary>Create a distributor. Server fills Id/Code/JoinedAt/AvatarColor when omitted.</summary>
    [HttpPost]
    public ActionResult<Distributor> Create([FromBody] DistributorCreateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = _repo.GetAll();
        var seq = existing.Count + 1;

        var distributor = new Distributor
        {
            Id = $"d-{DateTime.UtcNow.Ticks:x}",
            Code = string.IsNullOrWhiteSpace(request.Code)
                ? $"DST-{seq:000}"
                : request.Code,
            Name = request.Name,
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            City = request.City,
            JoinedAt = string.IsNullOrWhiteSpace(request.JoinedAt)
                ? DateTime.UtcNow.ToString("yyyy-MM-dd")
                : request.JoinedAt,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status,
            AvatarColor = string.IsNullOrWhiteSpace(request.AvatarColor)
                ? Palette[existing.Count % Palette.Length]
                : request.AvatarColor,
        };

        var created = _repo.Insert(distributor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Update a distributor.</summary>
    [HttpPut("{id}")]
    public ActionResult<Distributor> Update(string id, [FromBody] DistributorUpdateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var current = _repo.GetById(id);
        if (current is null) return NotFound();

        current.Name = request.Name;
        current.Code = request.Code ?? current.Code;
        current.ContactPerson = request.ContactPerson;
        current.Email = request.Email;
        current.Phone = request.Phone;
        current.Address = request.Address;
        current.City = request.City;
        current.JoinedAt = request.JoinedAt ?? current.JoinedAt;
        current.Status = request.Status ?? current.Status;
        current.AvatarColor = request.AvatarColor ?? current.AvatarColor;

        var updated = _repo.Update(current);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>Delete a distributor (also clears any territory assignment).</summary>
    [HttpDelete("{id}")]
    public IActionResult Delete(string id) =>
        _repo.Delete(id) ? NoContent() : NotFound();
}
