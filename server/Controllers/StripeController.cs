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
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StripeController> _logger;
    private readonly string _webhookSecret;

    public StripeController(
        IStripeService stripeService,
        ITicketService ticketService,
        server.Services.IEmailService emailService,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<StripeController> logger)
    {
        _stripeService = stripeService;
        _ticketService = ticketService;
        _emailService = emailService;
        _context = context;
        _logger = logger;
        _webhookSecret = configuration["StripeSettings:WebhookSecret"] ?? string.Empty;
    }

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request)
    {
        try
        {
            // Join profile names, IDs, prices and emails into metadata for the webhook
            var profilesMetadata = string.Join("|", request.Profiles.Select(p => $"{p.Id}:{p.Name}:{p.Price}:{p.Email}"));

            var session_id = await _stripeService.CreateCheckoutSessionAsync(
                request.EventId,
                request.BuyerEmail,
                request.BuyerName,
                request.Amount,
                request.SuccessUrl,
                request.CancelUrl,
                profilesMetadata, // Pass profiles metadata
                request.BuyerUserId?.ToString() // Pass buyer user id
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
                    await HandleCheckoutSessionCompleted(session);
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

    private async Task HandleCheckoutSessionCompleted(Stripe.Checkout.Session session)
    {
        try 
        {
            var eventIdStr = session.Metadata.TryGetValue("EventId", out var eId) ? eId : "N/A";
            var buyerName = session.Metadata.TryGetValue("BuyerName", out var bName) ? bName : "Unknown";
            var buyerEmail = session.CustomerEmail;
            var amountTotal = (decimal)session.AmountTotal! / 100m;

            _logger.LogInformation("Processing CheckoutSessionCompleted for Session {SessionId}, Event {EventId}, Buyer: {BuyerEmail}, Amount: {Amount}", session.Id, eventIdStr, buyerEmail, amountTotal);

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
            {
                _logger.LogWarning("Event not found for ID {EventId}", eventId);
            }
            
            // Check for multiple profiles in metadata
            if (session.Metadata.TryGetValue("Profiles", out var profilesMetadata) && !string.IsNullOrEmpty(profilesMetadata))
            {
                _logger.LogInformation("Creating multiple tickets from metadata: {ProfilesMetadata}", profilesMetadata);
                // Format: "Id:Name:Price:Email|Id:Name:Price:Email"
                var profileEntries = profilesMetadata.Split('|');
                foreach (var entry in profileEntries)
                {
                    var parts = entry.Split(':');
                    if (parts.Length >= 2)
                    {
                        var profileId = int.Parse(parts[0]);
                        var profileName = parts[1];
                        var profilePrice = parts.Length > 2 ? decimal.Parse(parts[2]) : (amountTotal / profileEntries.Length);
                        var profileEmail = parts.Length > 3 ? parts[3] : buyerEmail;

                        // Ensure we have an email
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
                // Single ticket fallback
                int? buyerUserId = null;
                if (session.Metadata.TryGetValue("BuyerUserId", out var userIdStr) && int.TryParse(userIdStr, out var bId))
                {
                    buyerUserId = bId;
                }

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
                    qrCode
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
            // We don't throw here to avoid failing the whole webhook if one email fails
        }
    }
}
