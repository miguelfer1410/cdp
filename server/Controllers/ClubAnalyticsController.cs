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
        var totalMembers = await _context.Users.CountAsync(u => u.MemberProfile != null);
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
                totalMembers,
                registeredNotMembers
            },
            athletesPerSport,
            athletesPerTeam,
            genderDistribution = genderDist,
            ageGroups = new { minors, adults },
            coachesPerSport
        });
    }

    [HttpGet("financial")]
    public async Task<IActionResult> GetFinancialAnalytics()
    {
        var allPayments = await _context.Payments.ToListAsync();

        var totalRevenue      = allPayments.Where(p => p.Status == "Completed").Sum(p => p.Amount);
        var pendingRevenue    = allPayments.Where(p => p.Status == "Pending").Sum(p => p.Amount);
        var failedRevenue     = allPayments.Where(p => p.Status == "Failed").Sum(p => p.Amount);
        var totalTransactions = allPayments.Count;

        var paymentsByStatus = allPayments
            .GroupBy(p => p.Status)
            .Select(g => new { Status = g.Key, Count = g.Count(), TotalAmount = g.Sum(p => p.Amount) })
            .ToList();

        var revenueByMethod = allPayments
            .Where(p => p.Status == "Completed")
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new { Method = g.Key, TotalAmount = g.Sum(p => p.Amount), Count = g.Count() })
            .ToList();

        var revenueByMonth = allPayments
            .Where(p => p.Status == "Completed")
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new {
                Month       = $"{g.Key.Year}-{g.Key.Month:D2}",
                TotalAmount = g.Sum(p => p.Amount)
            })
            .ToList();

        // Full per-month breakdown (all statuses)
        var paymentStatsByMonth = allPayments
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new {
                Month           = $"{g.Key.Year}-{g.Key.Month:D2}",
                TotalCount      = g.Count(),
                CompletedAmount = g.Where(p => p.Status == "Completed").Sum(p => p.Amount),
                PendingAmount   = g.Where(p => p.Status == "Pending").Sum(p => p.Amount),
                FailedAmount    = g.Where(p => p.Status == "Failed").Sum(p => p.Amount),
                CompletedCount  = g.Count(p => p.Status == "Completed"),
                PendingCount    = g.Count(p => p.Status == "Pending"),
                FailedCount     = g.Count(p => p.Status == "Failed"),
            })
            .ToList();

        // ── Revenue by Sport ──────────────────────────────────────────────────
        // Join: Payment → MemberProfile → User → AthleteProfile → AthleteTeams (active) → Team → Sport
        // ── Revenue by Sport (Start from Sports to include all) ─────
        var revenueBySportList = await _context.Sports
            .Select(s => new {
                Sport = s.Name,
                TotalAmount = _context.Payments
                    .Where(p => p.Status == "Completed")
                    .Where(p => _context.AthleteTeams.Any(at => at.Team.SportId == s.Id && at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
                    .Sum(p => (decimal?)p.Amount) ?? 0,
                Count = _context.Payments
                    .Where(p => p.Status == "Completed")
                    .Count(p => _context.AthleteTeams.Any(at => at.Team.SportId == s.Id && at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
            })
            .ToListAsync();

        var revenueBySport = revenueBySportList
            .Select(x => (dynamic)new { x.Sport, x.TotalAmount, x.Count })
            .ToList();

        var unassignedSportRevenue = await _context.Payments
            .Where(p => p.Status == "Completed")
            .Where(p => !_context.AthleteTeams.Any(at => at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
            .SumAsync(p => (decimal?)p.Amount) ?? 0;
            
        var unassignedSportCount = await _context.Payments
            .Where(p => p.Status == "Completed")
            .Where(p => !_context.AthleteTeams.Any(at => at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
            .CountAsync();

        if (unassignedSportRevenue > 0 || unassignedSportCount > 0)
        {
            // Note: In the final list we will merge or handle these. 
            // The frontend handles 'Sem Modalidade' and 'Sem Equipa' separately.
        }

        // ── Revenue by Team (Sport + Team Name) ─────────────────────
        // Join: Payment → MemberProfile → User → AthleteProfile → AthleteTeams (active) → Team → Sport
        // ── Revenue by Team (Start from Teams to include all) ───────
        var revenueByTeamList = await _context.Teams
            .Where(t => t.IsActive)
            .Select(t => new {
                Label = t.Sport.Name + " - " + t.Name + 
                        (t.Gender == Gender.Male ? " (Masc.)" : 
                         t.Gender == Gender.Female ? " (Fem.)" : ""),
                TotalAmount = _context.Payments
                    .Where(p => p.Status == "Completed")
                    .Where(p => _context.AthleteTeams.Any(at => at.TeamId == t.Id && at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
                    .Sum(p => (decimal?)p.Amount) ?? 0,
                Count = _context.Payments
                    .Where(p => p.Status == "Completed")
                    .Count(p => _context.AthleteTeams.Any(at => at.TeamId == t.Id && at.LeftAt == null && at.AthleteProfile.UserId == p.MemberProfile.UserId))
            })
            .ToListAsync();

        var revenueByTeam = revenueByTeamList
            .Select(x => (dynamic)new { Team = x.Label, x.TotalAmount, x.Count })
            .ToList();

        if (unassignedSportRevenue > 0 || unassignedSportCount > 0)
        {
            revenueByTeam.Add(new { Team = "Sem Equipa", TotalAmount = unassignedSportRevenue, Count = unassignedSportCount });
        }
        
        if (unassignedSportRevenue > 0) {
            revenueBySport.Add(new { Sport = "Sem Modalidade", TotalAmount = unassignedSportRevenue, Count = unassignedSportCount });
        }
        
        revenueBySport = revenueBySport.OrderByDescending(s => (decimal)s.TotalAmount).ToList();
        revenueByTeam = revenueByTeam.OrderByDescending(x => (decimal)x.TotalAmount).ToList();

        return Ok(new
        {
            totalRevenue,
            pendingRevenue,
            failedRevenue,
            totalTransactions,
            paymentsByStatus,
            revenueByMethod,
            revenueByMonth,
            paymentStatsByMonth,
            revenueBySport,
            revenueByTeam
        });
    }
}