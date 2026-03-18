using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.DTOs;
using System.Security.Claims;
using CdpApi.Services;
using server.Services;
using server.Models;
using CdpApi.Models;
using System.Linq;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(ApplicationDbContext context, ILogger<PaymentController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // HELPER: resolve which userId the caller is authorised to access
    // ────────────────────────────────────────────────────────────────────────────
    private async Task<int?> GetAuthorizedUserIdAsync(int? requestedUserId)
    {
        var loggedInIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(loggedInIdClaim) || !int.TryParse(loggedInIdClaim, out int loggedInId))
            return null;

        if (!requestedUserId.HasValue || requestedUserId.Value == loggedInId)
            return loggedInId;

        // Admins can access any user's data
        if (User.IsInRole("Admin"))
            return requestedUserId.Value;

        var loggedInUser = await _context.Users.FindAsync(loggedInId);
        var requestedUser = await _context.Users.FindAsync(requestedUserId.Value);
        if (loggedInUser == null || requestedUser == null) return null;

        var GetBase = (string email) =>
        {
            var atIndex = email.ToLower().LastIndexOf('@');
            if (atIndex < 0) return email.ToLower();
            var local = email.Substring(0, atIndex).ToLower();
            var domain = email.Substring(atIndex).ToLower();
            var plusIndex = local.IndexOf('+');
            return (plusIndex >= 0 ? local.Substring(0, plusIndex) : local) + domain;
        };

        if (GetBase(loggedInUser.Email) != GetBase(requestedUser.Email))
            return null;

        return requestedUserId.Value;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // GET: api/payment/quota
    // ────────────────────────────────────────────────────────────────────────────
    [HttpGet("quota")]
    [Authorize]
    public async Task<ActionResult> GetCurrentQuota([FromQuery] int? userId)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null)
                return Unauthorized(new { message = "Unauthorized access to this user's quota" });

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .Include(u => u.AthleteProfile)
                    .ThenInclude(ap => ap.AthleteTeams)
                        .ThenInclude(at => at.Team)
                            .ThenInclude(t => t.Sport)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);

            if (user == null || user.MemberProfile == null)
                return BadRequest(new { message = "User not found" });

            // ── Calculate with full breakdown ─────────────────────────────────
            var result = await CalculateQuotaWithBreakdown(user);

            // ── Determine period ──────────────────────────────────────────────
            string preference = user.MemberProfile.PaymentPreference ?? "Monthly";
            int currentYear  = DateTime.UtcNow.Year;
            int currentMonth = DateTime.UtcNow.Month;
            int? nextPeriodMonth = null;
            int  nextPeriodYear  = currentYear;

            if (preference == "Annual")
            {
                nextPeriodYear  = currentYear + 1;
                nextPeriodMonth = null;
            }
            else
            {
                if (currentMonth == 12) { nextPeriodMonth = 1; nextPeriodYear = currentYear + 1; }
                else nextPeriodMonth = currentMonth + 1;
            }

            // ── Check existing payment ────────────────────────────────────────
            var existingPayment = await _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                            p.Status == "Completed" &&
                            p.PeriodYear == currentYear &&
                            (preference == "Annual" || p.PeriodMonth == currentMonth))
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            string status = existingPayment != null ? "Regularizada" : "Unpaid";

            // Check for pending reference
            object? paymentDetails = null;
            if (status != "Regularizada")
            {
                var existingPendingPayment = await _context.Payments
                    .Where(p => p.MemberProfileId == user.MemberProfile.Id && p.Status == "Pending")
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (existingPendingPayment != null)
                {
                    status = "Pendente";
                    paymentDetails = new
                    {
                        entity      = existingPendingPayment.Entity,
                        reference   = existingPendingPayment.Reference,
                        amount      = existingPendingPayment.Amount,
                        id          = existingPendingPayment.Id,
                        periodMonth = existingPendingPayment.PeriodMonth,
                        periodYear  = existingPendingPayment.PeriodYear,
                        description = existingPendingPayment.Description
                    };
                }
            }

            // ── Calculate overdue months (Monthly only) ───────────────────────
            var overdueMonths = new List<object>();
            decimal overdueTotal = 0;

            if (preference == "Monthly")
            {
                // Find when the member first registered
                var memberSince = user.MemberProfile.MemberSince ?? user.CreatedAt;
                var startYear   = memberSince.Year;
                var startMonth  = memberSince.Month;

                // Iterate from registration month up to (but not including) current month
                var checkYear  = startYear;
                var checkMonth = startMonth;

                while (checkYear < currentYear || (checkYear == currentYear && checkMonth < currentMonth))
                {
                    // Was there a Completed payment for this period?
                    bool paid = await _context.Payments.AnyAsync(p =>
                        p.MemberProfileId == user.MemberProfile.Id &&
                        p.Status          == "Completed" &&
                        p.PeriodYear      == checkYear &&
                        p.PeriodMonth     == checkMonth);

                    if (!paid)
                    {
                        overdueMonths.Add(new
                        {
                            periodMonth = checkMonth,
                            periodYear  = checkYear,
                            amount      = result.Total
                        });
                        overdueTotal += result.Total;
                    }

                    // Advance to next month
                    if (checkMonth == 12) { checkMonth = 1; checkYear++; }
                    else checkMonth++;
                }
            }

            // totalDue = overdue from past months + current month (if unpaid)
            decimal totalDue = overdueTotal + (status == "Regularizada" ? 0 : result.Total);

            return Ok(new
            {
                amount            = result.Total,
                breakdown         = result.Breakdown,
                discountsApplied  = result.DiscountsApplied,
                inscriptionInfo   = result.InscriptionInfo,
                status            = status,
                periodMonth       = preference == "Annual" ? (int?)null : currentMonth,
                periodYear        = currentYear,
                paymentPreference = preference,
                nextPeriodMonth   = nextPeriodMonth,
                nextPeriodYear    = nextPeriodYear,
                existingPayment   = paymentDetails,
                overdueMonths     = overdueMonths,
                overdueTotal      = overdueTotal,
                totalDue          = totalDue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating quota");
            return StatusCode(500, new { message = "Error calculating quota" });
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    // POST: api/payment/inscription/mark-paid  (Admin only)
    // Marks an athlete's inscription fee as paid for a specific team
    // ────────────────────────────────────────────────────────────────────────────
    [HttpPost("inscription/mark-paid")]
    [Authorize]
    public async Task<ActionResult> MarkInscriptionPaid([FromBody] MarkInscriptionPaidRequest request)
    {
        var athleteTeam = await _context.AthleteTeams.FindAsync(request.AthleteTeamId);
        if (athleteTeam == null)
            return NotFound(new { message = "Registo de equipa não encontrado." });

        athleteTeam.InscriptionPaid    = true;
        athleteTeam.InscriptionPaidDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Inscrição marcada como paga." });
    }

    // ────────────────────────────────────────────────────────────────────────────
    // EXISTING ENDPOINTS (kept as-is) — admin/athletes-status, reference, check, etc.
    // ────────────────────────────────────────────────────────────────────────────

    // GET: api/payment/admin/athletes-status
    [HttpGet("admin/athletes-status")]
    [Authorize]
    public async Task<ActionResult<PaginatedResponse<AthletePaymentStatusDto>>> GetAthletePaymentStatuses(
        [FromQuery] int? month = null,
        [FromQuery] int? year  = null,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int? teamId = null,
        [FromQuery] int? sportId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var targetYear  = year  ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        try
        {
            // PHASE 1: Lightweight query - only IDs and basic info, no heavy includes
            var lightQuery = _context.Users.Where(u => u.MemberProfile != null && u.IsActive);

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                lightQuery = lightQuery.Where(u => 
                    u.FirstName.ToLower().Contains(s) || 
                    u.LastName.ToLower().Contains(s) || 
                    u.Email.ToLower().Contains(s) ||
                    (u.Nif != null && u.Nif.Contains(s)) ||
                    (u.MemberProfile != null && u.MemberProfile.MembershipNumber.ToLower().Contains(s))
                );
            }

            if (teamId.HasValue)
            {
                if (teamId.Value == -1)
                {
                    // Filter for athletes without any active team assignment
                    lightQuery = lightQuery.Where(u => u.AthleteProfile == null || !u.AthleteProfile.AthleteTeams.Any(at => at.LeftAt == null));
                }
                else if (teamId.Value == -2)
                {
                    // Filter for athletes with at least one active team assignment
                    lightQuery = lightQuery.Where(u => u.AthleteProfile != null && u.AthleteProfile.AthleteTeams.Any(at => at.LeftAt == null));
                }
                else
                {
                    lightQuery = lightQuery.Where(u => u.AthleteProfile != null && u.AthleteProfile.AthleteTeams.Any(at => at.TeamId == teamId.Value && at.LeftAt == null));
                }
            }

            if (sportId.HasValue)
                lightQuery = lightQuery.Where(u => u.AthleteProfile != null && u.AthleteProfile.AthleteTeams.Any(at => at.Team.SportId == sportId.Value && at.LeftAt == null));

            var lightMembers = await lightQuery
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Select(u => new
                {
                    u.Id,
                    MemberProfileId   = u.MemberProfile!.Id,
                    PaymentPreference = u.MemberProfile.PaymentPreference ?? "Monthly",
                    MembershipNumber  = u.MemberProfile.MembershipNumber,
                    Name              = u.FirstName + " " + u.LastName,
                    Team              = u.AthleteProfile != null ? u.AthleteProfile.AthleteTeams.Where(at => at.LeftAt == null).Select(at => at.Team.Name).FirstOrDefault() ?? "Sem Equipa" : "Sem Equipa",
                    Sport             = u.AthleteProfile != null ? u.AthleteProfile.AthleteTeams.Where(at => at.LeftAt == null).Select(at => at.Team.Sport.Name).FirstOrDefault() ?? "N/A" : "N/A"
                })
                .ToListAsync();

            // BATCH: load all relevant payments in ONE query
            var allProfileIds = lightMembers.Select(m => m.MemberProfileId).ToList();
            var allPayments = await _context.Payments
                .Where(p => allProfileIds.Contains(p.MemberProfileId) && p.PeriodYear == targetYear && (p.PeriodMonth == targetMonth || p.PeriodMonth == null))
                .Select(p => new { p.MemberProfileId, p.Status, p.PeriodMonth, p.CreatedAt, p.Entity, p.Reference })
                .ToListAsync();

            var paymentsByMember = allPayments
                .GroupBy(p => p.MemberProfileId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(p => p.CreatedAt).ToList());

            // Derive status in memory (no DB calls)
            var statusMap = lightMembers.Select(m =>
            {
                bool isAnnual = m.PaymentPreference == "Annual";
                var payments  = paymentsByMember.TryGetValue(m.MemberProfileId, out var list) ? list : null;
                var payment   = isAnnual
                    ? payments?.FirstOrDefault(p => p.PeriodMonth == null)
                    : payments?.FirstOrDefault(p => p.PeriodMonth == targetMonth);
                string derivedStatus = payment?.Status switch { "Completed" => "Regularizada", "Pending" => "Pendente", _ => "Unpaid" } ?? "Unpaid";
                return new
                {
                    m.Id, m.MemberProfileId, m.PaymentPreference, m.MembershipNumber, m.Name, m.Team, m.Sport,
                    Status = derivedStatus,
                    PendingEntity    = payment?.Status == "Pending" ? payment.Entity    : null,
                    PendingReference = payment?.Status == "Pending" ? payment.Reference : null,
                    Period = isAnnual ? $"{targetYear}" : $"{targetMonth}/{targetYear}"
                };
            }).ToList();

            // Apply status filter in memory
            var filtered = statusMap.AsEnumerable();
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                filtered = status.ToLower() switch
                {
                    "paid"    => filtered.Where(r => r.Status == "Regularizada"),
                    "pending" => filtered.Where(r => r.Status == "Pendente"),
                    "unpaid"  => filtered.Where(r => r.Status == "Unpaid"),
                    _         => filtered
                };
            }

            var filteredList  = filtered.ToList();
            int filteredTotal = filteredList.Count;
            var pageSlice     = filteredList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // PHASE 2: Load full data and calculate quotas ONLY for paged records (10/25/50)
            var pageUserIds = pageSlice.Select(r => r.Id).ToList();
            var fullUsers = await _context.Users
                .Include(u => u.AthleteProfile).ThenInclude(ap => ap.AthleteTeams).ThenInclude(at => at.Team).ThenInclude(t => t.Sport)
                .Include(u => u.MemberProfile)
                .Where(u => pageUserIds.Contains(u.Id))
                .ToListAsync();
            var fullUserMap = fullUsers.ToDictionary(u => u.Id);

            var pagedItems = new List<AthletePaymentStatusDto>();
            foreach (var row in pageSlice)
            {
                decimal amount = 0;
                if (fullUserMap.TryGetValue(row.Id, out var fullUser))
                {
                    var calc = await CalculateQuotaWithBreakdown(fullUser);
                    amount = calc.Total;
                }
                PaymentDetailsDto? paymentDetails = !string.IsNullOrEmpty(row.PendingReference)
                    ? new PaymentDetailsDto { Entity = row.PendingEntity ?? "", Reference = row.PendingReference ?? "" }
                    : null;

                pagedItems.Add(new AthletePaymentStatusDto
                {
                    UserId = row.Id, Name = row.Name, Team = row.Team, Sport = row.Sport,
                    PaymentPreference = row.PaymentPreference, MembershipNumber = row.MembershipNumber,
                    CurrentPeriod = row.Period,
                    Status = row.Status, Amount = amount, PaymentDetails = paymentDetails
                });
            }

            return Ok(new PaginatedResponse<AthletePaymentStatusDto>
            {
                Items = pagedItems, TotalCount = filteredTotal, Page = page,
                PageSize = pageSize, TotalPages = (int)Math.Ceiling(filteredTotal / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching athlete payment statuses");
            return StatusCode(500, new { message = "Erro ao obter estados de pagamento" });
        }
    }


    // POST: api/payment/reference
    [HttpPost("reference")]
    [Authorize]
    public async Task<ActionResult> GenerateReference(
        [FromServices] IEasypayService easypayService,
        [FromServices] IEmailService emailService,
        [FromQuery] int? userId)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null)
                return Unauthorized(new { message = "Unauthorized access" });

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .Include(u => u.AthleteProfile)
                    .ThenInclude(ap => ap.AthleteTeams)
                        .ThenInclude(at => at.Team)
                            .ThenInclude(t => t.Sport)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);

            if (user == null || user.MemberProfile == null)
                return BadRequest(new { message = "User or Member Profile not found." });

            var calc = await CalculateQuotaWithBreakdown(user);
            decimal totalAmount = calc.Total;

            if (totalAmount <= 0)
                return BadRequest(new { message = "Valor a pagar é zero." });

            int? periodMonth = null;
            int  periodYear  = DateTime.UtcNow.Year;

            if (int.TryParse(Request.Query["year"], out int y))
            {
                periodYear = y;
                if (int.TryParse(Request.Query["month"], out int m))
                    periodMonth = m;
            }
            else
            {
                if (user.MemberProfile.PaymentPreference != "Annual")
                    periodMonth = DateTime.UtcNow.Month;
            }

            string periodDescription = periodMonth.HasValue
                ? $"Quota Mensal - {new DateTime(periodYear, periodMonth.Value, 1):MMMM yyyy}"
                : $"Quota Anual - {periodYear}";

            string paymentKey = $"Quota_{targetUserId}_{periodYear}_{(periodMonth.HasValue ? periodMonth.ToString() : "Annual")}_{DateTime.UtcNow.Ticks}";

            var mbResult = await easypayService.GenerateMbReferenceAsync(
                totalAmount,
                paymentKey,
                $"{user.FirstName} {user.LastName}",
                user.Email,
                user.Phone);

            var payment = new Payment
            {
                MemberProfileId = user.MemberProfile.Id,
                Amount          = totalAmount,
                Status          = "Pending",
                PaymentMethod   = "MB",
                Entity          = mbResult.Entity,
                Reference       = mbResult.Reference,
                TransactionId   = mbResult.Id,
                Description     = periodDescription,
                PeriodMonth     = periodMonth,
                PeriodYear      = periodYear,
                CreatedAt       = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                entity      = mbResult.Entity,
                reference   = mbResult.Reference,
                amount      = totalAmount,
                description = periodDescription,
                id          = payment.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating payment reference");
            return StatusCode(500, new { message = "Erro ao gerar referência de pagamento." });
        }
    }

    // POST: api/payment/check/{id}
    [HttpPost("check/{id}")]
    [Authorize]
    public async Task<ActionResult> CheckPaymentStatus(int id, [FromServices] IEasypayService easypayService)
    {
        try
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound(new { message = "Pagamento não encontrado." });
            if (string.IsNullOrEmpty(payment.TransactionId))
                return BadRequest(new { message = "Este pagamento não tem ID de transação Easypay." });

            var statusResult = await easypayService.GetPaymentStatusAsync(payment.TransactionId);
            bool statusChanged = false;

            if (statusResult.Status.Equals("success", StringComparison.OrdinalIgnoreCase) ||
                statusResult.Status.Equals("captured", StringComparison.OrdinalIgnoreCase))
            {
                if (payment.Status != "Completed") { payment.Status = "Completed"; statusChanged = true; }
            }
            else if (statusResult.Status.Equals("deleted", StringComparison.OrdinalIgnoreCase) ||
                     statusResult.Status.Equals("failed", StringComparison.OrdinalIgnoreCase))
            {
                if (payment.Status != "Failed") { payment.Status = "Failed"; statusChanged = true; }
            }

            if (statusChanged) await _context.SaveChangesAsync();

            return Ok(new { id = payment.Id, status = payment.Status, easypayStatus = statusResult.Status });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking payment status");
            return StatusCode(500, new { message = "Erro ao verificar estado do pagamento." });
        }
    }

    // GET: api/payment/history
    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult> GetPaymentHistory([FromQuery] int? userId, [FromQuery] int? year)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);

            if (user?.MemberProfile == null) return BadRequest();

            var query = _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id && p.Status == "Completed");

            if (year.HasValue) query = query.Where(p => p.PeriodYear == year.Value);

            var payments = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();

            return Ok(payments.Select(p => new
            {
                id          = p.Id,
                amount      = p.Amount,
                status      = p.Status,
                method      = p.PaymentMethod,
                description = p.Description,
                periodMonth = p.PeriodMonth,
                periodYear  = p.PeriodYear,
                paymentDate = p.PaymentDate
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment history");
            return StatusCode(500, new { message = "Erro ao obter histórico." });
        }
    }

    // POST: api/payment/admin/manual-payment
    [HttpPost("admin/manual-payment")]
    [Authorize]
    public async Task<ActionResult> ManualPaymentUpdate([FromBody] ManualPaymentUpdateDto request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (user == null || user.MemberProfile == null)
                return NotFound(new { message = "Utilizador ou perfil de sócio não encontrado" });

            var existingPayment = await _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                            p.PeriodYear == request.PeriodYear &&
                            p.PeriodMonth == request.PeriodMonth)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPayment != null)
            {
                existingPayment.Status = request.Status;
                if (request.Status == "Completed") existingPayment.PaymentDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Pagamento atualizado com sucesso" });
            }
            else
            {
                var fullUser = await _context.Users
                    .Include(u => u.MemberProfile)
                    .Include(u => u.AthleteProfile)
                        .ThenInclude(ap => ap.AthleteTeams)
                            .ThenInclude(at => at.Team)
                                .ThenInclude(t => t.Sport)
                    .FirstOrDefaultAsync(u => u.Id == request.UserId);

                var calc   = await CalculateQuotaWithBreakdown(fullUser!);
                var amount = calc.Total;

                var newPayment = new Payment
                {
                    MemberProfileId = user.MemberProfile.Id,
                    Amount          = amount,
                    Status          = request.Status,
                    PaymentMethod   = "Manual",
                    PaymentDate     = request.Status == "Completed" ? DateTime.UtcNow : DateTime.MinValue,
                    Description     = request.PeriodMonth.HasValue
                        ? $"Quota Manual - {request.PeriodMonth.Value}/{request.PeriodYear}"
                        : $"Quota Manual - {request.PeriodYear}",
                    PeriodMonth     = request.PeriodMonth,
                    PeriodYear      = request.PeriodYear,
                    CreatedAt       = DateTime.UtcNow
                };
                _context.Payments.Add(newPayment);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Pagamento manual registado com sucesso" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing manual payment");
            return StatusCode(500, new { message = "Erro ao registar pagamento manual." });
        }
    }

    // PUT: api/payment/admin/membership-number
    [HttpPut("admin/membership-number")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateMembershipNumber([FromBody] UpdateMembershipNumberDto request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (user == null || user.MemberProfile == null)
                return NotFound(new { message = "Utilizador ou perfil de sócio não encontrado." });

            // Check for duplicates (excluding this user and only active users)
            var duplicate = await _context.Users
                .Include(u => u.MemberProfile)
                .Where(u => u.Id != request.UserId &&
                            u.IsActive &&
                            u.MemberProfile != null &&
                            u.MemberProfile.MembershipNumber == request.MembershipNumber)
                .Select(u => new { u.Id, Name = u.FirstName + " " + u.LastName })
                .FirstOrDefaultAsync();

            // Always save
            user.MemberProfile.MembershipNumber = request.MembershipNumber;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                duplicate = duplicate != null ? new { userId = duplicate.Id, name = duplicate.Name } : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating membership number");
            return StatusCode(500, new { message = "Erro ao atualizar número de sócio." });
        }
    }

    // POST: api/payment/admin/mark-withdrawn
    [HttpPost("admin/mark-withdrawn")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> MarkAthleteWithdrawn([FromBody] MarkWithdrawnDto request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .Include(u => u.AthleteProfile)
                    .ThenInclude(ap => ap.AthleteTeams)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (user == null || user.MemberProfile == null)
                return NotFound(new { message = "Utilizador ou perfil de sócio não encontrado." });

            // Mark user as inactive
            user.IsActive = false;

            // Mark member profile as inactive
            user.MemberProfile.MembershipStatus = MembershipStatus.Inactive;

            // Set LeftAt for all active athlete teams
            if (user.AthleteProfile != null)
            {
                foreach (var team in user.AthleteProfile.AthleteTeams.Where(t => t.LeftAt == null))
                {
                    team.LeftAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Atleta marcado como desistente com sucesso." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking athlete as withdrawn");
            return StatusCode(500, new { message = "Erro ao marcar atleta como desistente." });
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CORE CALCULATION ENGINE
    // ════════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Calculates the monthly quota for a user applying all pricing rules from
    /// the CDP price table:
    ///   • Escalão-based pricing (Escalão 1 vs Escalão 2)
    ///   • Quota incluída (most sports bundle the member fee)
    ///   • Sibling discount (10%) when a sibling is also federated in the club
    ///   • 2nd-sport discount (same 10% on the cheaper sport)
    ///   • Parent exemption: children whose BOTH parents are active sócios pay
    ///     zero global member fee
    /// Returns a QuotaCalculationResult with the total and an itemised breakdown.
    /// </summary>
    private async Task<QuotaCalculationResult> CalculateQuotaWithBreakdown(User user)
    {
        var breakdown        = new List<BreakdownItem>();
        var discountsApplied = new List<string>();
        decimal total        = 0;

        // ── 1. Age ────────────────────────────────────────────────────────────
        bool isMinor = false;
        if (user.BirthDate.HasValue)
        {
            var today = DateTime.UtcNow.Date;
            var age   = today.Year - user.BirthDate.Value.Year;
            if (user.BirthDate.Value.Date > today.AddYears(-age)) age--;
            isMinor = age < 18;
        }

        // ── 2. Parent-member exemption ────────────────────────────────────────
        bool isExemptFromGlobalFee = false;
        var familyLinks = await _context.UserFamilyLinks
            .Where(l => l.UserId == user.Id || l.LinkedUserId == user.Id)
            .Include(l => l.User).ThenInclude(u => u.MemberProfile)
            .Include(l => l.LinkedUser).ThenInclude(u => u.MemberProfile)
            .ToListAsync();

        var fathers = new List<User>();
        var mothers = new List<User>();

        foreach (var l in familyLinks)
        {
            var other = l.UserId == user.Id ? l.LinkedUser : l.User;
            var rel   = l.UserId == user.Id ? GetReciprocalRelationship(l.Relationship) : l.Relationship;
            if (rel == "Pai" && other.MemberProfile?.MembershipStatus == MembershipStatus.Active) fathers.Add(other);
            else if (rel == "Mãe" && other.MemberProfile?.MembershipStatus == MembershipStatus.Active) mothers.Add(other);
        }

        if (fathers.Any() && mothers.Any())
        {
            // Check that ≥2 siblings share both parents
            var commonChildren = new HashSet<int>();
            foreach (var father in fathers)
            {
                var fatherLinks = await _context.UserFamilyLinks
                    .Where(l => (l.UserId == father.Id || l.LinkedUserId == father.Id))
                    .ToListAsync();
                foreach (var fl in fatherLinks)
                {
                    var childId = fl.UserId == father.Id ? fl.LinkedUserId : fl.UserId;
                    var childRel = fl.UserId == father.Id ? GetReciprocalRelationship(fl.Relationship) : fl.Relationship;
                    if (childRel == "Filho(a)") commonChildren.Add(childId);
                }
            }

            if (commonChildren.Count >= 2 && commonChildren.Contains(user.Id))
            {
                isExemptFromGlobalFee = true;
                _logger.LogInformation("[QUOTA] User {Id} exempt from global member fee (both parents sócios + ≥2 siblings).", user.Id);
            }
        }

        // ── 3. Check for sibling athlete ──────────────────────────────────────
        bool hasSiblingAthlete = false;
        foreach (var l in familyLinks)
        {
            var other = l.UserId == user.Id ? l.LinkedUser : l.User;
            var rel   = l.UserId == user.Id ? GetReciprocalRelationship(l.Relationship) : l.Relationship;
            if (rel == "Irmão/Irmã" && other != null)
            {
                // Check if sibling has an active athlete team
                var siblingAthlete = await _context.AthleteProfiles
                    .Include(ap => ap.AthleteTeams)
                    .FirstOrDefaultAsync(ap => ap.UserId == other.Id);
                if (siblingAthlete?.AthleteTeams.Any(at => at.LeftAt == null) == true)
                {
                    hasSiblingAthlete = true;
                    break;
                }
            }
        }
        if (hasSiblingAthlete) discountsApplied.Add("sibling");

        // ── 4. Active sport teams ─────────────────────────────────────────────
        var activeTeams = user.AthleteProfile?.AthleteTeams
    ?.Where(at => at.LeftAt == null && at.Team?.Sport != null)
    .ToList() ?? new List<AthleteTeam>();

bool anyQuotaIncluded = activeTeams.Any(at => at.Team!.Sport!.QuotaIncluded);

// Detect if user is in Escalão 1
bool isEscalao1 = activeTeams.Any(at => {
    var e = at.AthleteProfile?.Escalao?.ToLower() ?? "";
    return e.Contains("1") || e.Contains("escalão 1") || e.Contains("escalao 1");
});

// ⚠️ NOVO: deduplica por modalidade — atleta em múltiplas equipas da mesma
// modalidade só paga UMA vez. Mantém a equipa com a quota mais alta (para
// ordenação consistente). As inscrições são tratadas separadamente por equipa.
var activeTeamsBySport = activeTeams
    .GroupBy(at => at.Team!.Sport!.Id)
    .Select(g => g.OrderByDescending(at => GetEscalaoFee(at, false)).First())
    .ToList();

// Sort: most-expensive first (discount applied to cheaper ones)
var teamsSorted = activeTeamsBySport
    .OrderByDescending(at => GetEscalaoFee(at, false))
    .ToList();

bool globalFeeAdded = false;

for (int i = 0; i < teamsSorted.Count; i++)
{
            var at    = teamsSorted[i];
            var sport = at.Team!.Sport!;
            bool isSecondSport = i > 0;

            // Apply sibling or 2nd-sport discount (fixed fee selection)
            bool applyDiscount = hasSiblingAthlete || isSecondSport;
            decimal sportFee = GetEscalaoFee(at, applyDiscount);

            if (applyDiscount && !isSecondSport && !discountsApplied.Contains("sibling"))
                discountsApplied.Add("sibling");
            
            if (isSecondSport && !discountsApplied.Contains("second_sport"))
                discountsApplied.Add("second_sport");

            decimal netFee = sportFee;
            string escalaoLabel = string.IsNullOrEmpty(at.AthleteProfile?.Escalao) ? "" : $" — {at.AthleteProfile?.Escalao}";

            // If this sport has quota included, it covers the global member fee too
            // CRITICAL: Escalão 1 pays quota separately even if QuotaIncluded is true!
            if (sport.QuotaIncluded && !globalFeeAdded && !isExemptFromGlobalFee && !isEscalao1)
            {
                globalFeeAdded = true;
                breakdown.Add(new BreakdownItem
                {
                    Label          = $"{sport.Name}{escalaoLabel} (quota incluída)",
                    Amount         = netFee,
                    IsDiscount     = false,
                    QuotaIncluded  = true,
                    SportName      = sport.Name,
                    Escalao        = at.AthleteProfile?.Escalao
                });
            }
            else if (!sport.QuotaIncluded || isEscalao1)
            {
                // For Escalao 1 or non-quota-included sports, we skip marking globalFeeAdded
                if (netFee > 0)
                    breakdown.Add(new BreakdownItem
                    {
                        Label      = $"{sport.Name}{escalaoLabel}",
                        Amount     = netFee,
                        IsDiscount = false,
                        SportName  = sport.Name,
                        Escalao    = at.AthleteProfile?.Escalao
                    });
                else
                    breakdown.Add(new BreakdownItem
                    {
                        Label      = $"{sport.Name}{escalaoLabel} (isento)",
                        Amount     = 0,
                        IsDiscount = false,
                        SportName  = sport.Name,
                        Escalao    = at.AthleteProfile?.Escalao
                    });
            }
            else
            {
                // Additional sport where quota is included but we already added global fee (or is 2nd sport)
                if (netFee > 0)
                    breakdown.Add(new BreakdownItem
                    {
                        Label      = $"{sport.Name}{escalaoLabel}",
                        Amount     = netFee,
                        IsDiscount = false,
                        SportName  = sport.Name,
                        Escalao    = at.AthleteProfile?.Escalao
                    });
            }

            total += netFee;
        }

        // ── 5. Global member fee (when not covered by any sport) ──────────────
        if (!globalFeeAdded && !isExemptFromGlobalFee)
        {
            string feeKey = isMinor ? "MinorMemberFee" : "MemberFee";
            var memberFeeSetting = await _context.SystemSettings.FindAsync(feeKey);
            if (isMinor && memberFeeSetting == null)
                memberFeeSetting = await _context.SystemSettings.FindAsync("MemberFee");

            if (memberFeeSetting != null && decimal.TryParse(memberFeeSetting.Value, out var parsedFee) && parsedFee > 0)
            {
                breakdown.Add(new BreakdownItem
                {
                    Label      = "Quota de Sócio",
                    Amount     = parsedFee,
                    IsDiscount = false
                });
                total += parsedFee;
            }
        }
        else if (isExemptFromGlobalFee)
        {
            breakdown.Add(new BreakdownItem
            {
                Label      = "Quota de Sócio (isenta — ambos os pais sócios)",
                Amount     = 0,
                IsDiscount = true
            });
            discountsApplied.Add("parent_member_exemption");
        }

        // ── 6. Inscription info (pending inscriptions) ────────────────────────
        var inscriptionInfo = activeTeams
            .Select(at => new InscriptionInfo
            {
                AthleteTeamId = at.Id,
                SportName     = at.Team!.Sport!.Name,
                Escalao       = at.AthleteProfile?.Escalao,
                Paid          = at.InscriptionPaid,
                PaidDate      = at.InscriptionPaidDate,
                FeeNormal     = at.Team.Sport.InscriptionFeeNormal,
                FeeDiscount   = hasSiblingAthlete ? at.Team.Sport.FeeDiscount : at.Team.Sport.InscriptionFeeNormal
            })
            .ToList();

        return new QuotaCalculationResult
        {
            Total            = Math.Max(total, 0),
            Breakdown        = breakdown,
            DiscountsApplied = discountsApplied,
            InscriptionInfo  = inscriptionInfo
        };
    }

    /// <summary>Legacy wrapper — returns only the total (used by existing callers).</summary>
    private async Task<decimal> CalculateQuotaForUser(User user)
    {
        var result = await CalculateQuotaWithBreakdown(user);
        return result.Total;
    }

    /// <summary>Returns the correct monthly fee for an AthleteTeam based on its Escalão and sibling/2nd-sport discount.</summary>
    private static decimal GetEscalaoFee(AthleteTeam at, bool applyDiscount)
    {
        var sport = at.Team?.Sport;
        if (sport == null) return 0;

        // When discount applies, always use the single FeeDiscount price regardless of escalão
        if (applyDiscount && sport.FeeDiscount > 0)
            return sport.FeeDiscount;

        var escalao = at.AthleteProfile?.Escalao;

        if (string.IsNullOrEmpty(escalao))
            return sport.FeeNormalNormal;

        var e = escalao.ToLower();

        if (e.Contains("1") || e.Contains("escalão 1") || e.Contains("escalao 1"))
            return sport.FeeEscalao1Normal;

        if (e.Contains("2") || e.Contains("escalão 2") || e.Contains("escalao 2"))
            return sport.FeeEscalao2Normal;

        // Fallback: treat as Normal
        return sport.FeeNormalNormal;
    }

    private static string? GetReciprocalRelationship(string? relationship)
    {
        if (string.IsNullOrEmpty(relationship)) return null;
        return relationship switch
        {
            "Pai"       => "Filho(a)",
            "Mãe"       => "Filho(a)",
            "Filho(a)"  => "Pai/Mãe",
            "Irmão/Irmã" => "Irmão/Irmã",
            "Cônjuge"   => "Cônjuge",
            _           => relationship
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════════════

public class MarkInscriptionPaidRequest
{
    public int AthleteTeamId { get; set; }
}

public class QuotaCalculationResult
{
    public decimal Total { get; set; }
    public List<BreakdownItem> Breakdown { get; set; } = new();
    public List<string> DiscountsApplied { get; set; } = new();
    public List<InscriptionInfo> InscriptionInfo { get; set; } = new();
}

public class BreakdownItem
{
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsDiscount { get; set; }
    public bool QuotaIncluded { get; set; }
    public string? SportName { get; set; }
    public string? Escalao { get; set; }
}

public class InscriptionInfo
{
    public int AthleteTeamId { get; set; }
    public string SportName { get; set; } = string.Empty;
    public string? Escalao { get; set; }
    public bool Paid { get; set; }
    public DateTime? PaidDate { get; set; }
    public decimal FeeNormal { get; set; }
    public decimal FeeDiscount { get; set; }
}