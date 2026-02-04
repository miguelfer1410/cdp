using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.DTOs;
using System.Security.Claims;

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

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Get all completed payments for this user
            var payments = await _context.Payments
                .Where(p => p.UserId == userId && p.Status == "Completed")
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
            else if (user.MemberSince.HasValue)
            {
                // Member but no payments - calculate from member since date
                nextPaymentDue = user.MemberSince.Value.AddMonths(1);
                paymentStatus = nextPaymentDue < DateTime.UtcNow ? "Atrasado" : "Pendente";
            }

            var summary = new PaymentSummaryResponse
            {
                MonthlyFee = 3.00m,
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
    public async Task<ActionResult<List<PaymentHistoryResponse>>> GetPaymentHistory()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Get last 12 payments for this user
            var payments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PaymentDate)
                .Take(12)
                .ToListAsync();

            var paymentHistory = payments.Select(p => new PaymentHistoryResponse
            {
                Id = p.Id,
                Month = GetMonthName(p.PaymentDate),
                PaymentDate = p.PaymentDate,
                Amount = p.Amount,
                Status = p.Status,
                Description = p.Description
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
        return $"{monthNames[date.Month - 1]} {date.Year}";
    }
}
