using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using System.Security.Claims;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EventsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/events - List all events with optional filters
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<EventResponse>>> GetEvents(
        [FromQuery] int? teamId = null,
        [FromQuery] int? sportId = null,
        [FromQuery] int? eventType = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.Events
            .Include(e => e.Sport)
            .Include(e => e.Team)
            .Include(e => e.Creator)
            .AsQueryable();

        // Apply filters
        if (teamId.HasValue)
        {
            query = query.Where(e => e.TeamId == teamId.Value);
        }

        if (sportId.HasValue)
        {
            query = query.Where(e => e.SportId == sportId.Value);
        }

        if (eventType.HasValue)
        {
            query = query.Where(e => (int)e.EventType == eventType.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(e => e.StartDateTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.EndDateTime <= endDate.Value);
        }

        var events = await query
            .OrderBy(e => e.StartDateTime)
            .ToListAsync();

        var response = events.Select(e => new EventResponse
        {
            Id = e.Id,
            Title = e.Title,
            EventType = e.EventType,
            StartDateTime = e.StartDateTime,
            EndDateTime = e.EndDateTime,
            TeamId = e.TeamId,
            TeamName = e.Team?.Name,
            SportId = e.SportId,
            SportName = e.Sport.Name,
            Location = e.Location,
            Description = e.Description,
            OpponentName = e.OpponentName,
            IsHomeGame = e.IsHomeGame,
            CreatedBy = e.CreatedBy,
            CreatedByName = $"{e.Creator.FirstName} {e.Creator.LastName}",
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    // GET: api/events/{id} - Get single event details
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<EventResponse>> GetEvent(int id)
    {
        var eventItem = await _context.Events
            .Include(e => e.Sport)
            .Include(e => e.Team)
            .Include(e => e.Creator)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (eventItem == null)
        {
            return NotFound(new { message = "Evento não encontrado" });
        }

        var response = new EventResponse
        {
            Id = eventItem.Id,
            Title = eventItem.Title,
            EventType = eventItem.EventType,
            StartDateTime = eventItem.StartDateTime,
            EndDateTime = eventItem.EndDateTime,
            TeamId = eventItem.TeamId,
            TeamName = eventItem.Team?.Name,
            SportId = eventItem.SportId,
            SportName = eventItem.Sport.Name,
            Location = eventItem.Location,
            Description = eventItem.Description,
            OpponentName = eventItem.OpponentName,
            IsHomeGame = eventItem.IsHomeGame,
            CreatedBy = eventItem.CreatedBy,
            CreatedByName = $"{eventItem.Creator.FirstName} {eventItem.Creator.LastName}",
            CreatedAt = eventItem.CreatedAt,
            UpdatedAt = eventItem.UpdatedAt
        };

        return Ok(response);
    }

    // POST: api/events - Create new event
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<EventResponse>> CreateEvent([FromBody] EventCreateRequest request)
    {
        // Get user ID from token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Utilizador não autenticado" });
        }

        var newEvent = new Event
        {
            Title = request.Title,
            EventType = request.EventType,
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            TeamId = request.TeamId,
            SportId = request.SportId,
            Location = request.Location,
            Description = request.Description,
            OpponentName = request.OpponentName,
            IsHomeGame = request.IsHomeGame,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEvent), new { id = newEvent.Id }, new EventResponse
        {
            Id = newEvent.Id,
            Title = newEvent.Title,
            EventType = newEvent.EventType,
            StartDateTime = newEvent.StartDateTime,
            EndDateTime = newEvent.EndDateTime,
            TeamId = newEvent.TeamId,
            SportId = newEvent.SportId,
            SportName = request.SportName, // temporary, will be loaded on next GET
            Location = newEvent.Location,
            Description = newEvent.Description,
            OpponentName = newEvent.OpponentName,
            IsHomeGame = newEvent.IsHomeGame,
            CreatedBy = newEvent.CreatedBy,
            CreatedAt = newEvent.CreatedAt,
            UpdatedAt = newEvent.UpdatedAt
        });
    }

    // PUT: api/events/{id} - Update event
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateEvent(int id, [FromBody] EventUpdateRequest request)
    {
        var eventItem = await _context.Events.FindAsync(id);

        if (eventItem == null)
        {
            return NotFound(new { message = "Evento não encontrado" });
        }

        eventItem.Title = request.Title;
        eventItem.EventType = request.EventType;
        eventItem.StartDateTime = request.StartDateTime;
        eventItem.EndDateTime = request.EndDateTime;
        eventItem.TeamId = request.TeamId;
        eventItem.SportId = request.SportId;
        eventItem.Location = request.Location;
        eventItem.Description = request.Description;
        eventItem.OpponentName = request.OpponentName;
        eventItem.IsHomeGame = request.IsHomeGame;
        eventItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/events/{id} - Delete event
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var eventItem = await _context.Events.FindAsync(id);

        if (eventItem == null)
        {
            return NotFound(new { message = "Evento não encontrado" });
        }

        _context.Events.Remove(eventItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs
public class EventResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public EventType EventType { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int? TeamId { get; set; }
    public string? TeamName { get; set; }
    public int SportId { get; set; }
    public string SportName { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? OpponentName { get; set; }
    public bool? IsHomeGame { get; set; }
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class EventCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public EventType EventType { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int? TeamId { get; set; }
    public int SportId { get; set; }
    public string? SportName { get; set; } // For display purposes in response
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? OpponentName { get; set; }
    public bool? IsHomeGame { get; set; }
}

public class EventUpdateRequest
{
    public string Title { get; set; } = string.Empty;
    public EventType EventType { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int? TeamId { get; set; }
    public int SportId { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? OpponentName { get; set; }
    public bool? IsHomeGame { get; set; }
}
