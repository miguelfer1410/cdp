using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using System.Security.Claims;
using System.Text.Json;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainingSchedulesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TrainingSchedulesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/trainingschedules
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<TrainingScheduleResponse>>> GetSchedules(
        [FromQuery] int? teamId = null,
        [FromQuery] int? sportId = null)
    {
        var query = _context.TrainingSchedules
            .Include(ts => ts.Team)
                .ThenInclude(t => t.Sport)
            .Include(ts => ts.Creator)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(ts => ts.TeamId == teamId.Value);
        }

        if (sportId.HasValue)
        {
            query = query.Where(ts => ts.Team.SportId == sportId.Value);
        }

        var schedules = await query.OrderBy(ts => ts.Team.Name).ToListAsync();

        var response = schedules.Select(ts => new TrainingScheduleResponse
        {
            Id = ts.Id,
            TeamId = ts.TeamId,
            TeamName = ts.Team.Name,
            SportName = ts.Team.Sport.Name,
            DaySchedules = JsonSerializer.Deserialize<List<DayScheduleItem>>(ts.DaySchedules) ?? new List<DayScheduleItem>(),
            Location = ts.Location,
            ValidFrom = ts.ValidFrom,
            ValidUntil = ts.ValidUntil,
            IsActive = ts.IsActive,
            CreatedBy = ts.CreatedBy,
            CreatedByName = $"{ts.Creator.FirstName} {ts.Creator.LastName}",
            CreatedAt = ts.CreatedAt,
            UpdatedAt = ts.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    // GET: api/trainingschedules/{id}
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<TrainingScheduleResponse>> GetSchedule(int id)
    {
        var schedule = await _context.TrainingSchedules
            .Include(ts => ts.Team)
                .ThenInclude(t => t.Sport)
            .Include(ts => ts.Creator)
            .FirstOrDefaultAsync(ts => ts.Id == id);

        if (schedule == null)
        {
            return NotFound(new { message = "Padrão de treino não encontrado" });
        }

        var response = new TrainingScheduleResponse
        {
            Id = schedule.Id,
            TeamId = schedule.TeamId,
            TeamName = schedule.Team.Name,
            SportName = schedule.Team.Sport.Name,
            DaySchedules = JsonSerializer.Deserialize<List<DayScheduleItem>>(schedule.DaySchedules) ?? new List<DayScheduleItem>(),
            Location = schedule.Location,
            ValidFrom = schedule.ValidFrom,
            ValidUntil = schedule.ValidUntil,
            IsActive = schedule.IsActive,
            CreatedBy = schedule.CreatedBy,
            CreatedByName = $"{schedule.Creator.FirstName} {schedule.Creator.LastName}",
            CreatedAt = schedule.CreatedAt,
            UpdatedAt = schedule.UpdatedAt
        };

        return Ok(response);
    }

    // POST: api/trainingschedules
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TrainingScheduleResponse>> CreateSchedule([FromBody] TrainingScheduleCreateRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Utilizador não autenticado" });
        }

        var schedule = new TrainingSchedule
        {
            TeamId = request.TeamId,
            DaySchedules = JsonSerializer.Serialize(request.DaySchedules),
            Location = request.Location,
            ValidFrom = request.ValidFrom.Date,
            ValidUntil = request.ValidUntil.Date,
            IsActive = request.IsActive,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TrainingSchedules.Add(schedule);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, new
        {
            Id = schedule.Id,
            TeamId = schedule.TeamId,
            DaySchedules = request.DaySchedules,
            Location = schedule.Location,
            ValidFrom = schedule.ValidFrom,
            ValidUntil = schedule.ValidUntil,
            IsActive = schedule.IsActive
        });
    }

    // PUT: api/trainingschedules/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateSchedule(int id, [FromBody] TrainingScheduleUpdateRequest request)
    {
        var schedule = await _context.TrainingSchedules.FindAsync(id);

        if (schedule == null)
        {
            return NotFound(new { message = "Padrão de treino não encontrado" });
        }

        schedule.TeamId = request.TeamId;
        schedule.DaySchedules = JsonSerializer.Serialize(request.DaySchedules);
        schedule.Location = request.Location;
        schedule.ValidFrom = request.ValidFrom.Date;
        schedule.ValidUntil = request.ValidUntil.Date;
        schedule.IsActive = request.IsActive;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/trainingschedules/{id}
    // DELETE: api/trainingschedules/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteSchedule(int id)
    {
        var schedule = await _context.TrainingSchedules.FindAsync(id);

        if (schedule == null)
        {
            return NotFound(new { message = "Padrão de treino não encontrado" });
        }

        // Apagar todos os treinos futuros (a partir de hoje) gerados por este padrão
        var today = DateTime.UtcNow.Date;
        var futureTrainings = await _context.Events
            .Where(e => e.TeamId == schedule.TeamId
                && e.EventType == EventType.Training
                && e.StartDateTime.Date >= today
                && e.StartDateTime.Date <= schedule.ValidUntil.Date)
            .ToListAsync();

        _context.Events.RemoveRange(futureTrainings);
        _context.TrainingSchedules.Remove(schedule);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/trainingschedules/cleanup-orphaned
    [HttpPost("cleanup-orphaned")]
    [Authorize]
    public async Task<IActionResult> CleanupOrphanedEvents()
    {
        var existingScheduleIds = await _context.TrainingSchedules.Select(ts => ts.Id).ToListAsync();
        
        // Find all training events
        var trainingEvents = await _context.Events
            .Where(e => e.EventType == EventType.Training && e.Description != null)
            .ToListAsync();

        var eventsToDelete = new List<Event>();

        foreach (var ev in trainingEvents)
        {
            // Extract ID from description pattern "#ID"
            var parts = ev.Description?.Split('#');
            if (parts?.Length > 1 && int.TryParse(parts[1], out var scheduleId))
            {
                if (!existingScheduleIds.Contains(scheduleId))
                {
                    eventsToDelete.Add(ev);
                }
            }
        }

        if (eventsToDelete.Any())
        {
            _context.Events.RemoveRange(eventsToDelete);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = $"{eventsToDelete.Count} treinos órfãos foram removidos." });
    }

    // POST: api/trainingschedules/{id}/generate
    [HttpPost("{id}/generate")]
    [Authorize]
    public async Task<ActionResult<GenerateEventsResponse>> GenerateEvents(int id)
    {
        var schedule = await _context.TrainingSchedules
            .Include(ts => ts.Team)
                .ThenInclude(t => t.Sport)
            .FirstOrDefaultAsync(ts => ts.Id == id);

        if (schedule == null)
        {
            return NotFound(new { message = "Padrão de treino não encontrado" });
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Utilizador não autenticado" });
        }


        // Delete existing training events for this team in the date range
        var existingTrainings = await _context.Events
            .Where(e => e.TeamId == schedule.TeamId
                && e.EventType == EventType.Training
                && e.StartDateTime.Date >= schedule.ValidFrom.Date
                && e.StartDateTime.Date <= schedule.ValidUntil.Date)
            .ToListAsync();

        _context.Events.RemoveRange(existingTrainings);

        // Generate new training events
        var eventsCreated = 0;
        var currentDate = schedule.ValidFrom.Date;

        var daySchedules = JsonSerializer.Deserialize<List<DayScheduleItem>>(schedule.DaySchedules)
            ?? new List<DayScheduleItem>();

        while (currentDate <= schedule.ValidUntil.Date)
        {
            var dayName = currentDate.DayOfWeek.ToString();
            var match = daySchedules.FirstOrDefault(d => d.Day == dayName);

            if (match != null)
            {
                var startTime = TimeSpan.Parse(match.StartTime);
                var endTime   = TimeSpan.Parse(match.EndTime);

                _context.Events.Add(new Event
                {
                    Title = $"Treino - {schedule.Team.Name}",
                    EventType = EventType.Training,
                    StartDateTime = currentDate.Add(startTime),
                    EndDateTime   = currentDate.Add(endTime),
                    TeamId = schedule.TeamId,
                    SportId = schedule.Team.SportId,
                    Location = schedule.Location,
                    Description = $"Treino gerado automaticamente pelo padrão #{schedule.Id}",
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                eventsCreated++;
            }
            currentDate = currentDate.AddDays(1);
        }

        await _context.SaveChangesAsync();

        return Ok(new GenerateEventsResponse
        {
            EventsDeleted = existingTrainings.Count,
            EventsCreated = eventsCreated,
            Message = $"{eventsCreated} treinos criados para {schedule.Team.Name}"
        });
    }
}

// DTOs
public class TrainingScheduleResponse
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string SportName { get; set; } = string.Empty;
    public List<DayScheduleItem> DaySchedules { get; set; } = new();
    public string? Location { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; }
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class GenerateEventsResponse
{
    public int EventsDeleted { get; set; }
    public int EventsCreated { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class DayScheduleItem
{
    public string Day { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}

// Substitui TrainingScheduleCreateRequest e TrainingScheduleUpdateRequest
public class TrainingScheduleCreateRequest
{
    public int TeamId { get; set; }
    public List<DayScheduleItem> DaySchedules { get; set; } = new();
    public string? Location { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TrainingScheduleUpdateRequest : TrainingScheduleCreateRequest { }

