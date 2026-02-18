using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using server.Services;

namespace CdpApi.Controllers
{
    [ApiController]
    [Route("api/game-callups")]
    public class GameCallUpController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<GameCallUpController> _logger;

        public GameCallUpController(ApplicationDbContext context, IEmailService emailService, ILogger<GameCallUpController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: api/game-callups/{eventId}
        [HttpGet("{eventId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<int>>> GetCallUps(int eventId)
        {
            var callUps = await _context.GameCallUps
                .Where(g => g.EventId == eventId)
                .Select(g => g.AthleteId)
                .ToListAsync();

            return Ok(callUps);
        }

        // POST: api/game-callups
        [HttpPost]
        [Authorize]
        public async Task<ActionResult> UpdateCallUps([FromBody] UpdateCallUpRequest request)
        {
            var evt = await _context.Events
                .Include(e => e.Team)
                .Include(e => e.Sport)
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (evt == null)
            {
                return NotFound("Evento não encontrado.");
            }

            if (evt.EventType != Models.EventType.Game)
            {
                return BadRequest("Apenas jogos permitem convocatórias.");
            }

            // Get existing call-ups
            var existingCallUps = await _context.GameCallUps
                .Where(g => g.EventId == request.EventId)
                .ToListAsync();

            var existingAthleteIds = existingCallUps.Select(g => g.AthleteId).ToList();
            var newAthleteIds = request.AthleteIds;

            // Identify additions and removals
            var toAdd = newAthleteIds.Except(existingAthleteIds).ToList();
            var toRemove = existingAthleteIds.Except(newAthleteIds).ToList();

            // Remove unselected
            if (toRemove.Any())
            {
                var removeEntities = existingCallUps.Where(g => toRemove.Contains(g.AthleteId));
                _context.GameCallUps.RemoveRange(removeEntities);
            }

            // Add new selected
            var addedAthletes = new List<AthleteProfile>();
            if (toAdd.Any())
            {
                foreach (var athleteId in toAdd)
                {
                    _context.GameCallUps.Add(new GameCallUp
                    {
                        EventId = request.EventId,
                        AthleteId = athleteId
                    });
                }

                // Fetch athlete details for emails
                addedAthletes = await _context.AthleteProfiles
                    .Include(a => a.User)
                    .Where(a => toAdd.Contains(a.Id))
                    .ToListAsync();
            }

            await _context.SaveChangesAsync();

            // Send emails to newly added athletes
            foreach (var athlete in addedAthletes)
            {
                if (athlete.User != null && !string.IsNullOrEmpty(athlete.User.Email))
                {
                    // Fire and forget email to not block response
                    _ = _emailService.SendGameCallUpEmailAsync(
                        athlete.User.Email,
                        athlete.User.FirstName + " " + athlete.User.LastName,
                        evt.Title,
                        evt.StartDateTime,
                        evt.Location ?? "Local a definir"
                    );
                }
            }

            return Ok(new { message = "Convocatória atualizada com sucesso.", addedCount = toAdd.Count, removedCount = toRemove.Count });
        }
    }

    public class UpdateCallUpRequest
    {
        public int EventId { get; set; }
        public List<int> AthleteIds { get; set; } = new List<int>();
    }
}
