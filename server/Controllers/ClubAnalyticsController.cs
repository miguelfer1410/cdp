using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ClubAnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ClubAnalyticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalytics()
    {
        var now = DateTime.UtcNow;

        // Overview stats
        var totalAthletes = await _context.AthleteProfiles.CountAsync();
        var totalTeams = await _context.Teams.CountAsync(t => t.IsActive);
        var totalSports = await _context.Sports.CountAsync(s => s.IsActive);
        var totalCoaches = await _context.CoachProfiles.CountAsync();

        // Athletes per Sport
        var athletesPerSport = await _context.Sports
            .Where(s => s.IsActive)
            .Select(s => new
            {
                SportName = s.Name,
                Count = _context.AthleteTeams
                    .Count(at => at.Team.SportId == s.Id && at.LeftAt == null)
            })
            .ToListAsync();

        // Athletes per Team (All teams, with sport name)
        var athletesPerTeam = await _context.Teams
            .Where(t => t.IsActive)
            .Include(t => t.Sport)
            .OrderByDescending(t => t.AthleteTeams.Count(at => at.LeftAt == null))
            .Select(t => new
            {
                TeamName = $"{t.Sport.Name} - {t.Name}",
                Count = t.AthleteTeams.Count(at => at.LeftAt == null)
            })
            .ToListAsync();

        // Gender Distribution (based on Team Gender)
        var genderDist = await _context.AthleteTeams
            .Where(at => at.LeftAt == null)
            .GroupBy(at => at.Team.Gender)
            .Select(g => new
            {
                Gender = g.Key.ToString(),
                Count = g.Count()
            })
            .ToListAsync();

        // Age Groups (Minor < 18 vs Adult >= 18)
        var users = await _context.Users
            .Where(u => u.AthleteProfile != null && u.BirthDate.HasValue)
            .Select(u => u.BirthDate)
            .ToListAsync();

        int minors = 0;
        int adults = 0;
        foreach (var birthDate in users)
        {
            var age = now.Year - birthDate!.Value.Year;
            if (birthDate.Value.Date > now.AddYears(-age)) age--;
            if (age < 18) minors++;
            else adults++;
        }

        // Coaches per Sport
        var coachesPerSport = await _context.Sports
            .Where(s => s.IsActive)
            .Select(s => new
            {
                SportName = s.Name,
                Count = _context.CoachProfiles.Count(cp => cp.SportId == s.Id)
            })
            .ToListAsync();

        // User Breakdown
        var totalUsers = await _context.Users.CountAsync();
        var membersNotAthletes = await _context.Users.CountAsync(u => u.MemberProfile != null && u.AthleteProfile == null);
        var registeredNotMembers = await _context.Users.CountAsync(u => u.MemberProfile == null);

        return Ok(new
        {
            overview = new
            {
                totalAthletes,
                totalTeams,
                totalSports,
                totalCoaches,
                totalUsers,
                membersNotAthletes,
                registeredNotMembers
            },
            athletesPerSport,
            athletesPerTeam,
            genderDistribution = genderDist,
            ageGroups = new { minors, adults },
            coachesPerSport
        });
    }
}
