using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TeamsController> _logger;

    public TeamsController(
        ApplicationDbContext context,
        ILogger<TeamsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/teams - Public endpoint for active teams
    [HttpGet]
    public async Task<ActionResult<List<TeamResponse>>> GetActiveTeams()
    {
        try
        {
            var teams = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .Where(t => t.IsActive)
                .OrderBy(t => t.Sport.Name)
                .ThenBy(t => t.Name)
                .Select(t => new TeamResponse
                {
                    Id = t.Id,
                    SportId = t.SportId,
                    SportName = t.Sport.Name,
                    Name = t.Name,
                    Category = t.Escalao != null ? t.Escalao.Name : null,
                    EscalaoId = t.EscalaoId,
                    Gender = t.Gender,
                    Season = t.Season,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(teams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active teams");
            return StatusCode(500, new { message = "Error retrieving teams" });
        }
    }

    // GET: api/teams/all - Admin only
    [HttpGet("all")]
    [Authorize]
    public async Task<ActionResult<List<TeamResponse>>> GetAllTeams()
    {
        try
        {
            var teams = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .OrderBy(t => t.Sport.Name)
                .ThenBy(t => t.Name)
                .Select(t => new TeamResponse
                {
                    Id = t.Id,
                    SportId = t.SportId,
                    SportName = t.Sport.Name,
                    Name = t.Name,
                    Category = t.Escalao != null ? t.Escalao.Name : null,
                    EscalaoId = t.EscalaoId,
                    Gender = t.Gender,
                    Season = t.Season,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(teams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all teams");
            return StatusCode(500, new { message = "Error retrieving teams" });
        }
    }

    // GET: api/teams/{id} - Get specific team details
    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDetailResponse>> GetTeam(int id)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .Where(t => t.Id == id)
                .Select(t => new TeamDetailResponse
                {
                    Id = t.Id,
                    SportId = t.SportId,
                    SportName = t.Sport.Name,
                    Name = t.Name,
                    Category = t.Escalao != null ? t.Escalao.Name : null,
                    EscalaoId = t.EscalaoId,
                    Gender = t.Gender,
                    Season = t.Season,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    Coaches = t.CoachTeams.Select(ct => new TeamCoachInfo
                    {
                        Id = ct.CoachProfile.Id,
                        UserId = ct.CoachProfile.UserId,
                        Name = ct.CoachProfile.User.FirstName + " " + ct.CoachProfile.User.LastName,
                        Role = "Treinador"
                    }).ToList(),
                    Athletes = t.AthleteTeams
                        .Where(at => at.LeftAt == null)
                        .Select(at => new TeamAthleteInfo
                        {
                            Id = at.AthleteProfileId,
                            UserId = at.AthleteProfile.UserId,
                            Name = at.AthleteProfile.User.FirstName + " " + at.AthleteProfile.User.LastName,
                            JerseyNumber = at.JerseyNumber,
                            Position = at.Position,
                            IsCaptain = at.IsCaptain
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            return Ok(team);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting team {TeamId}", id);
            return StatusCode(500, new { message = "Error retrieving team" });
        }
    }

    // POST: api/teams - Admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TeamResponse>> CreateTeam([FromBody] TeamRequest request)
    {
        try
        {
            // Validate that the sport exists
            var sport = await _context.Sports.FindAsync(request.SportId);
            if (sport == null)
            {
                return BadRequest(new { message = "Invalid sport ID" });
            }

            var team = new Team
            {
                SportId = request.SportId,
                Name = request.Name,
                EscalaoId = request.EscalaoId,
                Gender = request.Gender,
                Season = request.Season,
                IsActive = request.IsActive
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            // Reload with Sport info
            var createdTeam = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .Where(t => t.Id == team.Id)
                .Select(t => new TeamResponse
                {
                    Id = t.Id,
                    SportId = t.SportId,
                    SportName = t.Sport.Name,
                    Name = t.Name,
                    Category = t.Escalao != null ? t.Escalao.Name : null,
                    EscalaoId = t.EscalaoId,
                    Gender = t.Gender,
                    Season = t.Season,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, createdTeam);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating team");
            return StatusCode(500, new { message = "Error creating team" });
        }
    }

    // PUT: api/teams/{id} - Admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateTeam(int id, [FromBody] TeamRequest request)
    {
        try
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            // Validate that the sport exists
            var sport = await _context.Sports.FindAsync(request.SportId);
            if (sport == null)
            {
                return BadRequest(new { message = "Invalid sport ID" });
            }

            team.SportId = request.SportId;
            team.Name = request.Name;
            team.EscalaoId = request.EscalaoId;
            team.Gender = request.Gender;
            team.Season = request.Season;
            team.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            // Return updated team with Sport info
            var updatedTeam = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .Where(t => t.Id == id)
                .Select(t => new TeamResponse
                {
                    Id = t.Id,
                    SportId = t.SportId,
                    SportName = t.Sport.Name,
                    Name = t.Name,
                    Category = t.Escalao != null ? t.Escalao.Name : null,
                    EscalaoId = t.EscalaoId,
                    Gender = t.Gender,
                    Season = t.Season,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt
                })
                .FirstAsync();

            return Ok(updatedTeam);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating team {TeamId}", id);
            return StatusCode(500, new { message = "Error updating team" });
        }
    }

    // POST: api/teams/{id}/advance - Admin only
    [HttpPost("{id}/advance")]
    [Authorize]
    public async Task<ActionResult<TeamResponse>> AdvanceTeam(int id)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.Sport)
                .Include(t => t.Escalao)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            // Parse and increment season (Format: "2024/2025")
            string newSeason = string.Empty;
            if (!string.IsNullOrEmpty(team.Season) && team.Season.Contains('/'))
            {
                var parts = team.Season.Split('/');
                if (parts.Length == 2 && int.TryParse(parts[0], out int year1) && int.TryParse(parts[1], out int year2))
                {
                    newSeason = $"{year1 + 1}/{year2 + 1}";
                }
            }
            
            if (string.IsNullOrEmpty(newSeason))
            {
                // Fallback to current/next year if parsing fails
                int currentYear = DateTime.Now.Year;
                newSeason = $"{currentYear}/{currentYear + 1}";
            }

            var nextTeam = new Team
            {
                SportId = team.SportId,
                Name = team.Name,
                EscalaoId = team.EscalaoId,
                Gender = team.Gender,
                Season = newSeason,
                IsActive = true // New season team starts active
            };

            _context.Teams.Add(nextTeam);
            await _context.SaveChangesAsync();

            // Return the new team info
            var response = new TeamResponse
            {
                Id = nextTeam.Id,
                SportId = nextTeam.SportId,
                SportName = team.Sport.Name,
                Name = nextTeam.Name,
                Category = team.Escalao?.Name,
                EscalaoId = nextTeam.EscalaoId,
                Gender = nextTeam.Gender,
                Season = nextTeam.Season,
                IsActive = nextTeam.IsActive,
                CreatedAt = nextTeam.CreatedAt
            };

            return CreatedAtAction(nameof(GetTeam), new { id = nextTeam.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error advancing team {TeamId}", id);
            return StatusCode(500, new { message = "Error advancing team to next season" });
        }
    }

    // DELETE: api/teams/{id} - Admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteTeam(int id)
    {
        try
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting team {TeamId}", id);
            return StatusCode(500, new { message = "Error deleting team" });
        }
    }

    // POST: api/teams/{id}/athletes - Add athletes to team
    [HttpPost("{id}/athletes")]
    [Authorize]
    public async Task<IActionResult> AddAthletes(int id, [FromBody] AddAthletesRequest request)
    {
        try
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            if (request.AthleteProfileIds == null || !request.AthleteProfileIds.Any())
            {
                return BadRequest(new { message = "No athletes provided" });
            }

            // Get ALL existing memberships (active or inactive) for this team to perform upsert
            var existingMemberships = await _context.AthleteTeams
                .Where(at => at.TeamId == id && request.AthleteProfileIds.Contains(at.AthleteProfileId))
                .ToListAsync();

            var newAthletes = new List<AthleteTeam>();
            int addedCount = 0;

            foreach (var athleteId in request.AthleteProfileIds)
            {
                var existingMembership = existingMemberships.FirstOrDefault(at => at.AthleteProfileId == athleteId);

                if (existingMembership != null)
                {
                    // If exists but inactive (removed), reactivate it
                    if (existingMembership.LeftAt != null)
                    {
                        existingMembership.LeftAt = null;
                        existingMembership.JoinedAt = DateTime.UtcNow; 
                        addedCount++;
                    }
                    // If exists and active, do nothing
                }
                else
                {
                    // Verify athlete exists
                    var athleteExists = await _context.AthleteProfiles.AnyAsync(ap => ap.Id == athleteId);
                    if (athleteExists)
                    {
                        newAthletes.Add(new AthleteTeam
                        {
                            TeamId = id,
                            AthleteProfileId = athleteId,
                            JoinedAt = DateTime.UtcNow
                        });
                        addedCount++;
                    }
                }
            }

            if (newAthletes.Any())
            {
                _context.AthleteTeams.AddRange(newAthletes);
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"{newAthletes.Count} athletes added successfully", addedCount = newAthletes.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding athletes to team {TeamId}", id);
            return StatusCode(500, new { message = "Error adding athletes to team" });
        }
    }
    // POST: api/teams/{id}/coaches - Add coaches to team
    [HttpPost("{id}/coaches")]
    [Authorize]
    public async Task<IActionResult> AddCoaches(int id, [FromBody] AddCoachesRequest request)
    {
        try
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            if (request.CoachProfileIds == null || !request.CoachProfileIds.Any())
            {
                return BadRequest(new { message = "No coaches provided" });
            }

            int addedCount = 0;

            foreach (var coachId in request.CoachProfileIds)
            {
                var coach = await _context.CoachProfiles.FirstOrDefaultAsync(c => c.Id == coachId || c.UserId == coachId);
                
                if (coach != null)
                {
                    // Only assign if they are not already assigned to this team
                    if (!await _context.CoachTeams.AnyAsync(ct => ct.TeamId == id && ct.CoachProfileId == coach.Id))
                    {
                        _context.CoachTeams.Add(new CoachTeam
                        {
                            TeamId = id,
                            CoachProfileId = coach.Id,
                            JoinedAt = DateTime.UtcNow
                        });
                        addedCount++;
                    }
                }
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"{addedCount} coaches added successfully", addedCount = addedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding coaches to team {TeamId}", id);
            return StatusCode(500, new { message = "Error adding coaches to team" });
        }
    }

    // DELETE: api/teams/{teamId}/coaches/{coachId} - Remove coach from team
    [HttpDelete("{teamId}/coaches/{coachId}")]
    [Authorize]
    public async Task<IActionResult> RemoveCoachFromTeam(int teamId, int coachId)
    {
        try
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            var coachTeam = await _context.CoachTeams
                .Include(ct => ct.CoachProfile)
                .FirstOrDefaultAsync(ct => ct.TeamId == teamId && (ct.CoachProfileId == coachId || ct.CoachProfile.UserId == coachId));

            if (coachTeam == null)
            {
                return NotFound(new { message = "Coach not found in this team" });
            }

            _context.CoachTeams.Remove(coachTeam);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Coach removed from team successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing coach {CoachId} from team {TeamId}", coachId, teamId);
            return StatusCode(500, new { message = "Error removing coach from team" });
        }
    }

    // DELETE: api/teams/{teamId}/athletes/{athleteId} - Remove athlete from team
    [HttpDelete("{teamId}/athletes/{athleteId}")]
    [Authorize]
    public async Task<IActionResult> RemoveAthleteFromTeam(int teamId, int athleteId)
    {
        try
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                return NotFound(new { message = "Team not found" });
            }

            // Find the active athlete team record
            var athleteTeam = await _context.AthleteTeams
                .Where(at => at.TeamId == teamId && at.AthleteProfileId == athleteId && at.LeftAt == null)
                .FirstOrDefaultAsync();

            if (athleteTeam == null)
            {
                return NotFound(new { message = "Athlete not found in this team" });
            }

            // Soft delete by setting LeftAt
            athleteTeam.LeftAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Athlete removed from team successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing athlete {AthleteId} from team {TeamId}", athleteId, teamId);
            return StatusCode(500, new { message = "Error removing athlete from team" });
        }
    }
} // <- Esta chaveta fecha a classe TeamsController

// Request DTO
public class TeamRequest
{
    public int SportId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? EscalaoId { get; set; }
    public Gender Gender { get; set; } = Gender.Mixed;
    public string? Season { get; set; }
    public bool IsActive { get; set; } = true;
}

// Response DTO
public class TeamResponse
{
    public int Id { get; set; }
    public int SportId { get; set; }
    public string SportName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; } // Backward compatibility
    public int? EscalaoId { get; set; }
    public Gender Gender { get; set; }
    public string? Season { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TeamDetailResponse : TeamResponse
{
    public List<TeamCoachInfo> Coaches { get; set; } = new();
    public List<TeamAthleteInfo> Athletes { get; set; } = new();
}

public class TeamCoachInfo
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = "Treinador";
}

public class TeamAthleteInfo
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? JerseyNumber { get; set; }
    public string? Position { get; set; }
    public bool IsCaptain { get; set; }
    public int? Age { get; set; }
}

public class AddAthletesRequest
{
    public List<int> AthleteProfileIds { get; set; } = new();
}

public class AddCoachesRequest
{
    public List<int> CoachProfileIds { get; set; } = new();
}