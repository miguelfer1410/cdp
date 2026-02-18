using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AttendanceController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/attendance/event/5
    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<Attendance>>> GetEventAttendance(int eventId)
    {
        var evt = await _context.Events.FindAsync(eventId);

        if (evt == null)
        {
            return NotFound("Evento não encontrado.");
        }

        // Optional: Check if user has access to this team/event
        // For now, assuming authenticated users (coaches/admins) can view

        var attendance = await _context.Attendances
            .Include(a => a.Athlete)
                .ThenInclude(ap => ap.User)
            .Where(a => a.EventId == eventId)
            .ToListAsync();

        return attendance;
    }

    // POST: api/attendance/batch
    [HttpPost("batch")]
    public async Task<ActionResult> BatchUpdateAttendance([FromBody] BatchAttendanceRequest request)
    {
        if (request.EventId <= 0 || request.Attendances == null)
        {
            return BadRequest("Dados inválidos.");
        }

        var evt = await _context.Events.FindAsync(request.EventId);
        if (evt == null)
        {
            return NotFound("Evento não encontrado.");
        }

        // CRITICAL: Ensure event is a Training
        if (evt.EventType != EventType.Training)
        {
            return BadRequest("A assiduidade só pode ser registada para treinos.");
        }

        var userId = int.Parse(User.FindFirst("id")?.Value ?? "0");

        // Get existing attendance for this event
        var existingAttendance = await _context.Attendances
            .Where(a => a.EventId == request.EventId)
            .ToDictionaryAsync(a => a.AthleteId);

        foreach (var item in request.Attendances)
        {
            if (existingAttendance.TryGetValue(item.AthleteId, out var existingRecord))
            {
                // Update existing
                existingRecord.Status = item.Status;
                existingRecord.Reason = item.Reason;
                existingRecord.RecordedBy = userId; // Update who last modified it? Or keep original? Let's update.
                existingRecord.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new
                var newRecord = new Attendance
                {
                    EventId = request.EventId,
                    AthleteId = item.AthleteId,
                    Status = item.Status,
                    Reason = item.Reason,
                    RecordedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Attendances.Add(newRecord);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Assiduidade registada com sucesso." });
    }
}

public class BatchAttendanceRequest
{
    public int EventId { get; set; }
    public List<AttendanceItemDto> Attendances { get; set; } = new List<AttendanceItemDto>();
}

public class AttendanceItemDto
{
    public int AthleteId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Reason { get; set; }
}
