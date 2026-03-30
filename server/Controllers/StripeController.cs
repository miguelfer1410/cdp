using Microsoft.AspNetCore.Mvc;
using CdpApi.Services;
using CdpApi.Data;
using CdpApi.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StripeController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ITicketService _ticketService;
    private readonly server.Services.IEmailService _emailService;
    private readonly IMoloniService _moloniService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StripeController> _logger;
    private readonly string _webhookSecret;

    public StripeController(
        IStripeService stripeService,
        ITicketService ticketService,
        server.Services.IEmailService emailService,
        IMoloniService moloniService,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<StripeController> logger)
    {
        _stripeService = stripeService;
        _ticketService = ticketService;
        _emailService = emailService;
        _moloniService = moloniService;
        _context = context;
        _logger = logger;
        _webhookSecret = configuration["StripeSettings:WebhookSecret"] ?? string.Empty;
    }

    // ── Create Checkout Session for tickets ──────────────────────────────────
    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request)
    {
        try
        {
            var profilesMetadata = string.Join("|", request.Profiles.Select(p => $"{p.Id}:{p.Name}:{p.Price}:{p.Email}"));

            var session_id = await _stripeService.CreateCheckoutSessionAsync(
                request.EventId,
                request.BuyerEmail,
                request.BuyerName,
                request.Amount,
                request.SuccessUrl,
                request.CancelUrl,
                profilesMetadata,
                request.BuyerUserId?.ToString()
            );

            return Ok(new { sessionId = session_id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session");
            return BadRequest(new { message = ex.Message });
        }
    }

    public class CreateCheckoutRequest
    {
        public string EventId { get; set; } = string.Empty;
        public int? BuyerUserId { get; set; }
        public string BuyerEmail { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;
        public List<ProfileRequest> Profiles { get; set; } = new();
        public decimal Amount { get; set; }
        public string SuccessUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }

    public class ProfileRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    // ── Stripe Webhook ───────────────────────────────────────────────────────
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        _logger.LogInformation("Webhook received. Body length: {Length}", json.Length);

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json,
                Request.Headers["Stripe-Signature"], _webhookSecret, throwOnApiVersionMismatch: false);

            _logger.LogInformation("Stripe Event Type: {Type}", stripeEvent.Type);

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session != null)
                {
                    _logger.LogInformation("Processing CheckoutSessionCompleted for Session ID: {SessionId}", session.Id);

                    // Route to the correct handler based on session metadata
                    if (session.Metadata.TryGetValue("Type", out var sessionType) && sessionType == "quota")
                    {
                        await HandleQuotaPaymentCompleted(session);
                    }
                    else
                    {
                        await HandleCheckoutSessionCompleted(session);
                    }

                    _logger.LogInformation("Successfully handled CheckoutSessionCompleted");
                }
            }

            return Ok();
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe webhook signature verification failed. Error: {Message}", e.Message);
            return BadRequest();
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error processing Stripe webhook: {Message}", e.Message);
            return StatusCode(500, "Internal server error during webhook processing");
        }
    }

    // ── Quota payment completed handler ──────────────────────────────────────
    private async Task HandleQuotaPaymentCompleted(Stripe.Checkout.Session session)
    {
        try
        {
            _logger.LogInformation("Handling quota payment for session {SessionId}", session.Id);

            if (!session.Metadata.TryGetValue("MemberProfileId", out var memberProfileIdStr) ||
                !int.TryParse(memberProfileIdStr, out int memberProfileId))
            {
                _logger.LogError("Missing or invalid MemberProfileId in session {SessionId}", session.Id);
                return;
            }

            int? periodMonth = null;
            int periodYear = DateTime.UtcNow.Year;

            if (session.Metadata.TryGetValue("PeriodYear", out var yearStr) && int.TryParse(yearStr, out int py))
                periodYear = py;

            if (session.Metadata.TryGetValue("PeriodMonth", out var monthStr) &&
                !string.IsNullOrEmpty(monthStr) &&
                int.TryParse(monthStr, out int pm))
                periodMonth = pm;

            decimal amountPaid = session.AmountTotal.HasValue ? (decimal)session.AmountTotal.Value / 100m : 0;

            // Find the most recent Pending payment for this member/period
            var payment = await _context.Payments
                .Where(p => p.MemberProfileId == memberProfileId &&
                            p.Status == "Pending" &&
                            p.PeriodYear == periodYear &&
                            p.PeriodMonth == periodMonth)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (payment != null)
            {
                payment.Status        = "Completed";
                payment.TransactionId = session.Id;
                payment.PaymentDate   = DateTime.UtcNow;
                payment.Amount        = amountPaid;
                _logger.LogInformation("Updated existing pending payment {PaymentId} to Completed", payment.Id);
            }
            else
            {
                // No pending payment — create one (edge case / Stripe dashboard payment)
                string description = session.Metadata.TryGetValue("Description", out var d) ? d : $"Quota {periodYear}";
                payment = new Payment
                {
                    MemberProfileId = memberProfileId,
                    Amount          = amountPaid,
                    Status          = "Completed",
                    PaymentMethod   = "Stripe",
                    TransactionId   = session.Id,
                    Description     = description,
                    PeriodMonth     = periodMonth,
                    PeriodYear      = periodYear,
                    PaymentDate     = DateTime.UtcNow,
                    CreatedAt       = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
                _logger.LogInformation("Created new Completed payment for MemberProfile {MemberProfileId}", memberProfileId);
            }

            await _context.SaveChangesAsync();

            // Create Moloni invoice receipt (non-fatal if it fails)
            try
            {
                var user = await _context.Users
                    .Include(u => u.MemberProfile)
                    .FirstOrDefaultAsync(u => u.MemberProfile != null && u.MemberProfile.Id == memberProfileId);

                if (user != null)
                {
                    await _moloniService.CreateInvoiceReceiptAsync(payment, user);
                    _logger.LogInformation("Moloni invoice created for payment {PaymentId}", payment.Id);
                }
            }
            catch (Exception moloniEx)
            {
                _logger.LogError(moloniEx, "Failed to create Moloni invoice for payment {PaymentId}", payment.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in HandleQuotaPaymentCompleted");
            throw;
        }
    }

    // ── Ticket/event payment completed handler ───────────────────────────────
    private async Task HandleCheckoutSessionCompleted(Stripe.Checkout.Session session)
    {
        try
        {
            var eventIdStr  = session.Metadata.TryGetValue("EventId", out var eId) ? eId : "N/A";
            var buyerName   = session.Metadata.TryGetValue("BuyerName", out var bName) ? bName : "Unknown";
            var buyerEmail  = session.CustomerEmail;
            var amountTotal = (decimal)session.AmountTotal! / 100m;

            _logger.LogInformation("Processing CheckoutSessionCompleted for Session {SessionId}, Event {EventId}, Buyer: {BuyerEmail}, Amount: {Amount}",
                session.Id, eventIdStr, buyerEmail, amountTotal);

            int eventId;
            if (eventIdStr == "annual-ticket")
            {
                var annualEvent = await _context.Events.FirstOrDefaultAsync(e => e.Title == "Bilhete Anual");
                eventId = annualEvent?.Id ?? 0;
            }
            else if (!int.TryParse(eventIdStr, out eventId))
            {
                _logger.LogError("Invalid EventId in metadata: {EventIdStr}", eventIdStr);
                return;
            }

            var gameEvent = await _context.Events.FindAsync(eventId);
            if (gameEvent == null)
                _logger.LogWarning("Event not found for ID {EventId}", eventId);

            if (session.Metadata.TryGetValue("Profiles", out var profilesMetadata) && !string.IsNullOrEmpty(profilesMetadata))
            {
                _logger.LogInformation("Creating multiple tickets from metadata: {ProfilesMetadata}", profilesMetadata);
                var profileEntries = profilesMetadata.Split('|');
                foreach (var entry in profileEntries)
                {
                    var parts = entry.Split(':');
                    if (parts.Length >= 2)
                    {
                        var profileId    = int.Parse(parts[0]);
                        var profileName  = parts[1];
                        var profilePrice = parts.Length > 2 ? decimal.Parse(parts[2]) : (amountTotal / profileEntries.Length);
                        var profileEmail = parts.Length > 3 ? parts[3] : buyerEmail;

                        if (string.IsNullOrEmpty(profileEmail)) profileEmail = buyerEmail;

                        _logger.LogInformation("Creating ticket for profile {ProfileId}: {ProfileName} ({ProfileEmail})", profileId, profileName, profileEmail);
                        var ticket = await _ticketService.CreateTicketAsync(eventId, profileEmail!, profileName, profilePrice, session.Id, profileId);

                        _logger.LogInformation("Attempting to send email for ticket {TicketCode} to {Email}", ticket.TicketCode, profileEmail);
                        await SendTicketEmail(ticket, gameEvent, profileEmail!, profileName);
                    }
                }
            }
            else
            {
                int? buyerUserId = null;
                if (session.Metadata.TryGetValue("BuyerUserId", out var userIdStr) && int.TryParse(userIdStr, out var bId))
                    buyerUserId = bId;

                _logger.LogInformation("Creating single ticket for {BuyerName} (User: {UserId})", buyerName, buyerUserId);
                var ticket = await _ticketService.CreateTicketAsync(eventId, buyerEmail!, buyerName, amountTotal, session.Id, buyerUserId);

                _logger.LogInformation("Attempting to send email for single ticket {TicketCode} to {Email}", ticket.TicketCode, buyerEmail);
                await SendTicketEmail(ticket, gameEvent, buyerEmail!, buyerName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in HandleCheckoutSessionCompleted: {Message}. Inner: {InnerMessage}", ex.Message, ex.InnerException?.Message);
            throw;
        }
    }

    private async Task SendTicketEmail(Ticket ticket, CdpApi.Models.Event? gameEvent, string buyerEmail, string buyerName)
    {
        try
        {
            if (gameEvent != null)
            {
                _logger.LogInformation("Generating QR code for ticket {TicketCode}", ticket.TicketCode);
                var qrCode = await _ticketService.GenerateQrCodeAsync(ticket.TicketCode);

                _logger.LogInformation("Calling SendTicketEmailAsync for {BuyerEmail}", buyerEmail);
                await _emailService.SendTicketEmailAsync(
                    buyerEmail,
                    buyerName,
                    gameEvent.Title,
                    gameEvent.StartDateTime,
                    gameEvent.Location ?? "CDP",
                    qrCode,
                    ticket.TicketCode,
                    ticket.Price
                );
                _logger.LogInformation("SendTicketEmailAsync completed successfully for {BuyerEmail}", buyerEmail);
            }
            else
            {
                _logger.LogWarning("Cannot send email for ticket {TicketCode} because gameEvent is null", ticket.TicketCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ticket email to {Email}: {Message}", buyerEmail, ex.Message);
            // Don't throw — don't fail the webhook if an email fails
        }
    }
}
