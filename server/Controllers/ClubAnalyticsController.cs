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
        var revenueBySport = await _context.Payments
            .Where(p => p.Status == "Completed")
            .Join(_context.MemberProfiles,
                p  => p.MemberProfileId,
                mp => mp.Id,
                (p, mp) => new { Payment = p, mp.UserId })
            .Join(_context.Users,
                x => x.UserId,
                u => u.Id,
                (x, u) => new { x.Payment, User = u })
            .GroupJoin(_context.AthleteProfiles,
                x  => x.User.Id,
                ap => ap.UserId,
                (x, aps) => new { x.Payment, AthleteProfiles = aps })
            .SelectMany(
                x => x.AthleteProfiles.DefaultIfEmpty(),
                (x, ap) => new { x.Payment, AthleteProfile = ap })
            .GroupJoin(
                _context.AthleteTeams.Where(at => at.LeftAt == null)
                    .Include(at => at.Team).ThenInclude(t => t.Sport),
                x  => x.AthleteProfile != null ? (int?)x.AthleteProfile.Id : null,
                at => (int?)at.AthleteProfileId,
                (x, ats) => new { x.Payment, AthleteTeams = ats })
            .SelectMany(
                x => x.AthleteTeams.DefaultIfEmpty(),
                (x, at) => new {
                    x.Payment,
                    SportName = at != null && at.Team != null && at.Team.Sport != null
                        ? at.Team.Sport.Name
                        : "Sem Modalidade"
                })
            .GroupBy(x => x.SportName)
            .Select(g => new {
                Sport       = g.Key,
                TotalAmount = g.Sum(x => x.Payment.Amount),
                Count       = g.Count()
            })
            .OrderByDescending(g => g.TotalAmount)
            .ToListAsync();

        // ── Revenue by Escalão (competitive Team Escalão) ─────────────────────
        // Join: Payment → MemberProfile → User → AthleteProfile → AthleteTeams (active) → Team → Escalao
        var revenueByEscalao = await _context.Payments
            .Where(p => p.Status == "Completed")
            .Join(_context.MemberProfiles,
                p  => p.MemberProfileId,
                mp => mp.Id,
                (p, mp) => new { Payment = p, mp.UserId })
            .Join(_context.Users,
                x => x.UserId,
                u => u.Id,
                (x, u) => new { x.Payment, User = u })
            .GroupJoin(_context.AthleteProfiles,
                x  => x.User.Id,
                ap => ap.UserId,
                (x, aps) => new { x.Payment, AthleteProfiles = aps })
            .SelectMany(
                x => x.AthleteProfiles.DefaultIfEmpty(),
                (x, ap) => new { x.Payment, AthleteProfile = ap })
            .GroupJoin(
                _context.AthleteTeams.Where(at => at.LeftAt == null)
                    .Include(at => at.Team).ThenInclude(t => t.Escalao),
                x  => x.AthleteProfile != null ? (int?)x.AthleteProfile.Id : null,
                at => (int?)at.AthleteProfileId,
                (x, ats) => new { x.Payment, AthleteTeams = ats })
            .SelectMany(
                x => x.AthleteTeams.DefaultIfEmpty(),
                (x, at) => new {
                    x.Payment,
                    EscalaoName = at != null && at.Team != null && at.Team.Escalao != null
                        ? at.Team.Escalao.Name
                        : "Sem Escalão"
                })
            .GroupBy(x => x.EscalaoName)
            .Select(g => new {
                Escalao     = g.Key,
                TotalAmount = g.Sum(x => x.Payment.Amount),
                Count       = g.Count()
            })
            .OrderByDescending(g => g.TotalAmount)
            .ToListAsync();

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
            revenueByEscalao
        });
    }
}