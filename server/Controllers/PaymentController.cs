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

    // GET: api/payment/admin/athletes-status
    [HttpGet("admin/athletes-status")]
    [Authorize] // Roles = "Admin" check should be here or in global policy
    public async Task<ActionResult<IEnumerable<AthletePaymentStatusDto>>> GetAthletePaymentStatuses(
        [FromQuery] int? month = null,
        [FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        try
        {
            // Get all users with MemberProfile (Athletes and non-Athletes)
            var members = await _context.Users
                .Include(u => u.AthleteProfile)
                    .ThenInclude(ap => ap.AthleteTeams)
                        .ThenInclude(at => at.Team)
                            .ThenInclude(t => t.Sport)
                .Include(u => u.MemberProfile)
                .Where(u => u.MemberProfile != null && u.IsActive)
                .ToListAsync();

            var result = new List<AthletePaymentStatusDto>();

            foreach (var member in members)
            {
                // Determine relevant period
                int? periodMonth = null;
                int periodYear = targetYear;
                string paymentPreference = member.MemberProfile.PaymentPreference ?? "Monthly";

                if (paymentPreference == "Monthly")
                {
                    periodMonth = targetMonth;
                }

                // Check for existing payment
                var existingPayment = await _context.Payments
                    .Where(p => p.MemberProfileId == member.MemberProfile.Id &&
                                p.PeriodYear == periodYear &&
                                (p.PeriodMonth == periodMonth))
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                string status = "Unpaid";
                PaymentDetailsDto? paymentDetails = null;

                if (existingPayment != null)
                {
                    status = existingPayment.Status; // "Completed", "Pending", "Failed"
                    if (status == "Completed") status = "Paid";
                    
                    if (existingPayment.Status == "Pending" || existingPayment.Status == "Completed")
                    {
                        paymentDetails = new PaymentDetailsDto
                        {
                            PaymentId = existingPayment.Id,
                            Entity = existingPayment.Entity,
                            Reference = existingPayment.Reference,
                            Date = existingPayment.CreatedAt
                        };
                    }
                }

                // Determine Team Name and Sport
                string currentTeam = "Sócio";
                string currentSport = "-";

                if (member.AthleteProfile != null)
                {
                    var activeTeam = member.AthleteProfile.AthleteTeams
                        .FirstOrDefault(at => at.LeftAt == null);
                    
                    if (activeTeam != null)
                    {
                        currentTeam = activeTeam.Team?.Name ?? "Sem Equipa";
                        currentSport = activeTeam.Team?.Sport?.Name ?? "-";
                    }
                    else
                    {
                        currentTeam = "Sem Equipa";
                    }
                }

                var dto = new AthletePaymentStatusDto
                {
                    UserId = member.Id,
                    Name = $"{member.FirstName} {member.LastName}",
                    Team = currentTeam,
                    Sport = currentSport,
                    PaymentPreference = paymentPreference,
                    CurrentPeriod = periodMonth.HasValue ? $"{periodMonth.Value}/{periodYear}" : $"{periodYear}",
                    Status = status,
                    Amount = await CalculateQuotaForUser(member),
                    PaymentDetails = paymentDetails
                };

                result.Add(dto);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching athlete payment statuses");
            return StatusCode(500, new { message = "Erro ao obter estados de pagamento" });
        }
    }

    // POST: api/payment/admin/manual-payment
    [HttpPost("admin/manual-payment")]
    [Authorize] // Roles = "Admin"
    public async Task<ActionResult> ManualPaymentUpdate([FromBody] ManualPaymentUpdateDto request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (user == null || user.MemberProfile == null)
            {
                return NotFound(new { message = "Utilizador ou perfil de sócio não encontrado" });
            }

            // Check if payment exists
            var existingPayment = await _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                            p.PeriodYear == request.PeriodYear &&
                            (p.PeriodMonth == request.PeriodMonth))
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPayment != null)
            {
                // Update existing
                existingPayment.Status = request.Status; // "Completed", "Pending", "Failed"
                if (request.Status == "Completed")
                {
                    existingPayment.PaymentDate = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                return Ok(new { message = "Pagamento atualizado com sucesso" });
            }
            else
            {
                // Create new "Manual" payment
                var amount = await CalculateQuotaForUser(user);
                
                var newPayment = new Payment
                {
                    MemberProfileId = user.MemberProfile.Id,
                    Amount = amount,
                    Status = request.Status, // Likely "Completed"
                    PaymentMethod = "Manual",
                    PaymentDate = request.Status == "Completed" ? DateTime.UtcNow : DateTime.MinValue, // or handle as needed
                    CreatedAt = DateTime.UtcNow,
                    PeriodMonth = request.PeriodMonth,
                    PeriodYear = request.PeriodYear,
                    Description = $"Pagamento Manual - {request.PeriodMonth}/{request.PeriodYear}",
                    Entity = "MANUAL",
                    Reference = "MANUAL"
                };

                _context.Payments.Add(newPayment);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Pagamento manual criado com sucesso" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating manual payment");
            return StatusCode(500, new { message = "Erro ao atualizar pagamento manual" });
        }
    }

    [HttpGet("summary")]
    [Authorize]
    public async Task<ActionResult<PaymentSummaryResponse>> GetPaymentSummary()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (user.MemberProfile == null)
            {
                return BadRequest(new { message = "User does not have a member profile" });
            }

            // Get all completed payments for this member profile
            var payments = await _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id && p.Status == "Completed")
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            var lastPayment = payments.FirstOrDefault();
            var totalPayments = payments.Count;
            var totalPaid = payments.Sum(p => p.Amount);

            // Calculate next payment due date
            DateTime? nextPaymentDue = null;
            string paymentStatus = "Pendente";

            if (lastPayment != null)
            {
                // Next payment is due one month after last payment
                nextPaymentDue = lastPayment.PaymentDate.AddMonths(1);
                
                // Check if payment is overdue
                if (nextPaymentDue < DateTime.UtcNow)
                {
                    paymentStatus = "Atrasado";
                }
                else
                {
                    paymentStatus = "Em Dia";
                }
            }
            else if (user.MemberProfile.MemberSince.HasValue)
            {
                // Member but no payments - calculate from member since date
                nextPaymentDue = user.MemberProfile.MemberSince.Value.AddMonths(1);
                paymentStatus = nextPaymentDue < DateTime.UtcNow ? "Atrasado" : "Pendente";
            }

            var summary = new PaymentSummaryResponse
            {
                MonthlyFee = await CalculateQuotaForUser(user),
                LastPaymentDate = lastPayment?.PaymentDate,
                NextPaymentDue = nextPaymentDue,
                PaymentStatus = paymentStatus,
                TotalPayments = totalPayments,
                TotalPaid = totalPaid
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment summary");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving payment summary" });
        }
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult<List<PaymentHistoryResponse>>> GetPaymentHistory([FromQuery] int? userId)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null) return Unauthorized(new { message = "Unauthorized access" });

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);
            
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (user.MemberProfile == null)
            {
                return BadRequest(new { message = "User does not have a member profile" });
            }

            // Get all payments for this member profile ordered by period (newest first)
            var payments = await _context.Payments
                .Where(p => p.MemberProfileId == user.MemberProfile.Id)
                .OrderByDescending(p => p.PeriodYear)
                .ThenByDescending(p => p.PeriodMonth)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();

            var paymentHistory = payments.Select(p => new PaymentHistoryResponse
            {
                Id = p.Id,
                Month = GetMonthName(p.PeriodMonth.HasValue
                    ? new DateTime(p.PeriodYear ?? p.PaymentDate.Year, p.PeriodMonth.Value, 1)
                    : p.PaymentDate),
                PaymentDate = p.PaymentDate,
                Amount = p.Amount,
                Status = p.Status,
                Description = p.Description,
                PeriodMonth = p.PeriodMonth,
                PeriodYear = p.PeriodYear ?? p.PaymentDate.Year,
                Entity = p.Entity,
                Reference = p.Reference,
                PaymentMethod = p.PaymentMethod
            }).ToList();

            return Ok(paymentHistory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment history");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving payment history" });
        }
    }


    private string GetMonthName(DateTime date)
    {
        var monthNames = new[] { "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                                 "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" };
        var month = monthNames[date.Month - 1];
        return $"{month} {date.Year}";
    }

    // Helper to validate if logged-in user can access/manage requested user (self or linked alias)
    private async Task<int?> GetAuthorizedUserIdAsync(int? requestedUserId)
    {
        var loggedInIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(loggedInIdClaim) || !int.TryParse(loggedInIdClaim, out int loggedInId))
        {
            return null;
        }

        // If no specific user requested, or requested self, return logged-in ID
        if (!requestedUserId.HasValue || requestedUserId.Value == loggedInId)
        {
            return loggedInId;
        }

        // If requesting another user, verify they are linked (share base email)
        var loggedInUser = await _context.Users.FindAsync(loggedInId);
        var requestedUser = await _context.Users.FindAsync(requestedUserId.Value);

        if (loggedInUser == null || requestedUser == null)
        {
            return null;
        }

        // Check if emails share the same base (e.g. parent@mail.com and parent+child@mail.com)
        var email1 = loggedInUser.Email.ToLower();
        var email2 = requestedUser.Email.ToLower();

        var GetBase = (string email) => 
        {
            var atIndex = email.LastIndexOf('@');
            if (atIndex < 0) return email;
            var local = email.Substring(0, atIndex);
            var domain = email.Substring(atIndex);
            var plusIndex = local.IndexOf('+');
            var baseLocal = plusIndex >= 0 ? local.Substring(0, plusIndex) : local;
            return baseLocal + domain;
        };

        if (GetBase(email1) != GetBase(email2))
        {
            return null; // Not authorized
        }

        return requestedUserId.Value;
    }

    [HttpGet("quota")]
    [Authorize]
    public async Task<ActionResult> GetCurrentQuota([FromQuery] int? userId)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null) return Unauthorized(new { message = "Unauthorized access to this user's quota" });

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .Include(u => u.AthleteProfile)
                .ThenInclude(ap => ap.AthleteTeams)
                .ThenInclude(at => at.Team)
                .ThenInclude(t => t.Sport)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);
            
            if (user == null || user.MemberProfile == null)
            {
                return BadRequest(new { message = "User not found" });
            }

            decimal totalAmount = await CalculateQuotaForUser(user);

            // Determine current period (Annual vs Monthly)
            int? currentMonth = null;
            int currentYear = DateTime.UtcNow.Year;
            bool isAnnual = user.MemberProfile.PaymentPreference == "Annual";

            if (!isAnnual)
            {
                currentMonth = DateTime.UtcNow.Month;
            }

            bool isPaid = false;
            if (isAnnual)
            {
                isPaid = await _context.Payments.AnyAsync(p =>
                    p.MemberProfileId == user.MemberProfile.Id &&
                    p.Status == "Completed" &&
                    p.PeriodYear == currentYear &&
                    p.PeriodMonth == null);
            }
            else
            {
                isPaid = await _context.Payments.AnyAsync(p =>
                    p.MemberProfileId == user.MemberProfile.Id &&
                    p.Status == "Completed" &&
                    p.PeriodYear == currentYear &&
                    p.PeriodMonth == currentMonth);
            }

            string status = isPaid ? "Regularizada" : "Por Regularizar";
            object? paymentDetails = null;

            // Compute next period (for after paying)
            int? nextPeriodMonth = null;
            int nextPeriodYear = currentYear;
            if (isAnnual)
            {
                nextPeriodYear = currentYear + 1;
            }
            else
            {
                var next = new DateTime(currentYear, currentMonth!.Value, 1).AddMonths(1);
                nextPeriodMonth = next.Month;
                nextPeriodYear  = next.Year;
            }

            if (!isPaid)
            {
                // Look for a pending payment for THIS specific period first
                Payment? existingPendingPayment;
                if (isAnnual)
                {
                    existingPendingPayment = await _context.Payments
                        .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                                    p.Status == "Pending" &&
                                    p.PeriodYear == currentYear &&
                                    p.PeriodMonth == null)
                        .OrderByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();
                }
                else
                {
                    existingPendingPayment = await _context.Payments
                        .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                                    p.Status == "Pending" &&
                                    p.PeriodYear == currentYear &&
                                    p.PeriodMonth == currentMonth)
                        .OrderByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();
                }

                // Fallback: any pending payment
                existingPendingPayment ??= await _context.Payments
                    .Where(p => p.MemberProfileId == user.MemberProfile.Id &&
                                p.Status == "Pending")
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

            return Ok(new
            {
                amount          = totalAmount,
                status          = status,
                periodMonth     = currentMonth,
                periodYear      = currentYear,
                paymentPreference = user.MemberProfile.PaymentPreference ?? "Monthly",
                nextPeriodMonth = nextPeriodMonth,
                nextPeriodYear  = nextPeriodYear,
                existingPayment = paymentDetails
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating quota");
            return StatusCode(500, new { message = "Error calculating quota" });
        }
    }

    [HttpPost("reference")]
    [Authorize]
    public async Task<ActionResult> GenerateReference([FromServices] IEasypayService easypayService, [FromServices] IEmailService emailService, [FromQuery] int? userId)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(userId);
            if (targetUserId == null) return Unauthorized(new { message = "Unauthorized access" });

            var user = await _context.Users
                .Include(u => u.MemberProfile)
                .Include(u => u.AthleteProfile)
                .ThenInclude(ap => ap.AthleteTeams)
                .ThenInclude(at => at.Team)
                .ThenInclude(t => t.Sport) // To get Sport Fee
                .FirstOrDefaultAsync(u => u.Id == targetUserId);


            if (user == null || user.MemberProfile == null)
            {
                return BadRequest(new { message = "User or Member Profile not found." });
            }

            // 1. Calculate Total Amount
            decimal totalAmount = await CalculateQuotaForUser(user);

            if (totalAmount <= 0)
            {
                return BadRequest(new { message = "Valor a pagar é zero." });
            }

            // Determine period (Month/Year) based on preference
            int? periodMonth = null;
            int periodYear = DateTime.UtcNow.Year;

            // Check if passed in query (overrides auto-detection)
            if (int.TryParse(Request.Query["year"], out int y))
            {
                periodYear = y;
                if (int.TryParse(Request.Query["month"], out int m))
                {
                    periodMonth = m;
                }
            }
            else
            {
                // Default logic based on Member Profile Preference
                if (user.MemberProfile.PaymentPreference == "Annual")
                {
                    // For annual, just set the year (default to current year if not specified)
                    periodMonth = null;
                }
                else
                {
                    // Default to Monthly
                    // For now, default to current month if not specified
                    periodMonth = DateTime.UtcNow.Month;
                }
            }
            
            // Generate Description
            string periodDescription;
            string paymentKey;
            
            if (periodMonth.HasValue)
            {
                periodDescription = $"Quota Mensal - {new DateTime(periodYear, periodMonth.Value, 1):MMMM yyyy}";
                paymentKey = $"Quota_{userId}_{periodYear}_{periodMonth}_{DateTime.UtcNow.Ticks}";
            }
            else
            {
                periodDescription = $"Quota Anual - {periodYear}";
                paymentKey = $"Quota_{userId}_{periodYear}_Annual_{DateTime.UtcNow.Ticks}";
            }

            // 2. Generate Reference (REAL API)
            var mbResult = await easypayService.GenerateMbReferenceAsync(
                totalAmount, 
                paymentKey, 
                user.FirstName + " " + user.LastName, 
                user.Email, 
                user.Phone
            );

            // 3. Save Payment (Pending)
            var payment = new Payment
            {
                MemberProfileId = user.MemberProfile.Id,
                Amount = totalAmount,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = "Multibanco",
                Status = "Pending",
                Entity = mbResult.Entity,
                Reference = mbResult.Reference,
                Description = periodDescription,
                PeriodMonth = periodMonth,
                PeriodYear = periodYear,
                TransactionId = mbResult.Id // Store Easypay Resource ID here
            };
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // 4. Send Email
            var emailBody = $@"
                <h1>Referência Multibanco Gerada</h1>
                <p>Olá {user.FirstName},</p>
                <p>Aqui está a sua referência para pagamento das quotas ({periodDescription}):</p>
                <ul>
                    <li><strong>Entidade:</strong> {mbResult.Entity}</li>
                    <li><strong>Referência:</strong> {mbResult.Reference}</li>
                    <li><strong>Valor:</strong> {totalAmount:C2}</li>
                </ul>
                <p>Obrigado!</p>
            ";
            
            // Fire and forget email
            _ = emailService.SendContactEmailAsync(user.FirstName, user.Email, "Referência Multibanco - CDP", emailBody);

            return Ok(new
            {
                entity = mbResult.Entity,
                reference = mbResult.Reference,
                amount = totalAmount,
                message = "Referência gerada com sucesso."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating MB reference");
            return StatusCode(500, new { message = "Erro ao gerar referência." });
        }
    }

    [HttpPost("check/{id}")]
    [Authorize]
    public async Task<ActionResult> CheckPaymentStatus(int id, [FromServices] IEasypayService easypayService)
    {
        try
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Pagamento não encontrado." });
            }

            if (string.IsNullOrEmpty(payment.TransactionId))
            {
                return BadRequest(new { message = "Este pagamento não tem um ID de transação Easypay associado." });
            }

            // Call Easypay API to check status
            var statusResult = await easypayService.GetPaymentStatusAsync(payment.TransactionId);

            _logger.LogInformation($"Payment {id} status update: {statusResult.Status} (Raw: {statusResult.RawResponse})");

            bool statusChanged = false;
            
            // Adjust logic based on real Easypay response
            if (statusResult.Status.Equals("success", StringComparison.OrdinalIgnoreCase) || 
                statusResult.Status.Equals("captured", StringComparison.OrdinalIgnoreCase)) 
            {
                 if (payment.Status != "Completed")
                 {
                     payment.Status = "Completed";
                     // For subscriptions/captured payments, date might be now or from response
                     // payment.PaymentDate = DateTime.UtcNow; 
                     statusChanged = true;
                 }
            }
            else if (statusResult.Status.Equals("deleted", StringComparison.OrdinalIgnoreCase) ||
                     statusResult.Status.Equals("failed", StringComparison.OrdinalIgnoreCase))
            {
                if (payment.Status != "Failed")
                {
                    payment.Status = "Failed";
                    statusChanged = true;
                }
            }

            if (statusChanged)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new 
            { 
                id = payment.Id, 
                status = payment.Status, 
                easypayStatus = statusResult.Status 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking payment status");
            return StatusCode(500, new { message = "Erro ao verificar estado do pagamento." });
        }
    }

    private async Task<decimal> CalculateQuotaForUser(User user)
    {
        decimal totalAmount = 0;
        
        // Determine if user is a minor (under 18)
        bool isMinor = false;
        if (user.BirthDate.HasValue)
        {
            var today = DateTime.UtcNow.Date;
            var age = today.Year - user.BirthDate.Value.Year;
            if (user.BirthDate.Value.Date > today.AddYears(-age)) age--;
            isMinor = age < 18;
            _logger.LogInformation("Quota calculation for User {UserId}: BirthDate={BirthDate}, Age={Age}, IsMinor={IsMinor}", 
                user.Id, user.BirthDate.Value.ToShortDateString(), age, isMinor);
        }
        else
        {
            _logger.LogWarning("Quota calculation for User {UserId}: BirthDate is NULL", user.Id);
        }

        // Parent-Member Exemption Rule:
        // If two or more siblings have BOTH father and mother as active members, they are exempt from global member fee.
        bool isExemptFromGlobalFee = false;
        
        // 1. Find all parents of this user
        var parentsLinks = await _context.UserFamilyLinks
            .Where(l => (l.UserId == user.Id || l.LinkedUserId == user.Id))
            .Include(l => l.User).ThenInclude(u => u.MemberProfile)
            .Include(l => l.LinkedUser).ThenInclude(u => u.MemberProfile)
            .ToListAsync();

        var fathers = new List<User>();
        var mothers = new List<User>();

        foreach (var l in parentsLinks)
        {
            var other = l.UserId == user.Id ? l.LinkedUser : l.User;
            // rel is the relationship of 'other' to 'user'
            // If l.UserId == user.Id, l.Relationship is what 'user' IS to 'other'.
            // So 'other' IS the reciprocal of l.Relationship to 'user'.
            var rel = l.UserId == user.Id ? GetReciprocalRelationship(l.Relationship) : l.Relationship;

            if (rel == "Pai" && other.MemberProfile?.MembershipStatus == MembershipStatus.Active)
                fathers.Add(other);
            else if (rel == "Mãe" && other.MemberProfile?.MembershipStatus == MembershipStatus.Active)
                mothers.Add(other);
        }

        // 2. If at least one active father and one active mother are linked
        if (fathers.Any() && mothers.Any())
        {
            _logger.LogInformation("[QUOTA] User {UserId} has both parents as active members. Checking siblings...", user.Id);
            
            // 3. Find siblings: users who have both of these parents linked as parents
            var fatherId = fathers.First().Id;
            var motherId = mothers.First().Id;

            var fatherChildrenIds = await _context.UserFamilyLinks
                .Where(l => (l.UserId == fatherId || l.LinkedUserId == fatherId))
                .Select(l => new { l.UserId, l.LinkedUserId, l.Relationship })
                .ToListAsync();
            
            var childrenOfFather = fatherChildrenIds
                .Select(l => {
                    var otherId = l.UserId == fatherId ? l.LinkedUserId : l.UserId;
                    var rel = l.UserId == fatherId ? GetReciprocalRelationship(l.Relationship) : l.Relationship;
                    return new { Id = otherId, Relationship = rel };
                })
                .Where(x => x.Relationship == "Filho(a)")
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            var motherChildrenIds = await _context.UserFamilyLinks
                .Where(l => (l.UserId == motherId || l.LinkedUserId == motherId))
                .Select(l => new { l.UserId, l.LinkedUserId, l.Relationship })
                .ToListAsync();

            var childrenOfMother = motherChildrenIds
                .Select(l => {
                    var otherId = l.UserId == motherId ? l.LinkedUserId : l.UserId;
                    var rel = l.UserId == motherId ? GetReciprocalRelationship(l.Relationship) : l.Relationship;
                    return new { Id = otherId, Relationship = rel };
                })
                .Where(x => x.Relationship == "Filho(a)")
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            var commonChildren = childrenOfFather.Intersect(childrenOfMother).ToList();
            
            _logger.LogInformation("[QUOTA] User {UserId} belongs to a group of {Count} siblings sharing same parent members.", user.Id, commonChildren.Count());

            if (commonChildren.Count() >= 2 && commonChildren.Contains(user.Id))
            {
                isExemptFromGlobalFee = true;
                _logger.LogInformation("[QUOTA] User {UserId} is EXEMPT from global member fee.", user.Id);
            }
        }

        if (!isExemptFromGlobalFee)
        {
            // Global Member Fee
            string feeKey = isMinor ? "MinorMemberFee" : "MemberFee";
            var memberFeeSetting = await _context.SystemSettings.FindAsync(feeKey);
            
            // Fallback to "MemberFee" if "MinorMemberFee" is not set but user is minor
            if (isMinor && memberFeeSetting == null)
            {
                memberFeeSetting = await _context.SystemSettings.FindAsync("MemberFee");
            }

            if (memberFeeSetting != null && decimal.TryParse(memberFeeSetting.Value, out var parsedFee))
            {
                totalAmount += parsedFee;
            }
        }

        // Sport Fees - from the single athlete profile
        if (user.AthleteProfile?.AthleteTeams != null)
        {
            foreach (var athleteTeam in user.AthleteProfile.AthleteTeams)
            {
                if (athleteTeam.Team != null && athleteTeam.Team.Sport != null)
                {
                    totalAmount += athleteTeam.Team.Sport.MonthlyFee;
                }
            }
        }

        return totalAmount;
    }
    private static string? GetReciprocalRelationship(string? relationship)
    {
        if (string.IsNullOrEmpty(relationship)) return null;
        return relationship switch
        {
            "Pai" => "Filho(a)",
            "Mãe" => "Filho(a)",
            "Filho(a)" => "Pai/Mãe",
            "Irmão/Irmã" => "Irmão/Irmã",
            "Cônjuge" => "Cônjuge",
            _ => relationship
        };
    }
}
