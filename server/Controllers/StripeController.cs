using Microsoft.AspNetCore.Mvc;
using CdpApi.Services;
using CdpApi.Data;
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

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        _logger.LogInformation("Webhook received. Body length: {Length}", json.Length);
        
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json,
                Request.Headers["Stripe-Signature"], _webhookSecret);
            
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
            var eventId = int.Parse(session.Metadata["EventId"]);
            var buyerName = session.Metadata["BuyerName"];
            var buyerEmail = session.CustomerEmail;
            var amount = (decimal)session.AmountTotal! / 100m;

            _logger.LogInformation("Creating ticket for Event {EventId}, Buyer: {BuyerEmail}, Amount: {Amount}", eventId, buyerEmail, amount);

            // Create Ticket
            var ticket = await _ticketService.CreateTicketAsync(eventId, buyerEmail!, buyerName, amount, session.Id);
            _logger.LogInformation("Ticket created successfully with Code: {TicketCode}", ticket.TicketCode);

            // Get Event details for email
            var gameEvent = await _context.Events.FindAsync(eventId);
            if (gameEvent != null)
            {
                _logger.LogInformation("Generating QR code for ticket {TicketCode}", ticket.TicketCode);
                // Generate QR Code
                var qrCode = await _ticketService.GenerateQrCodeAsync(ticket.TicketCode);

                _logger.LogInformation("Sending ticket email to {BuyerEmail}", buyerEmail);
                // Send Email
                await _emailService.SendTicketEmailAsync(
                    buyerEmail!,
                    buyerName,
                    gameEvent.Title,
                    gameEvent.StartDateTime,
                    gameEvent.Location ?? "CDP",
                    qrCode
                );
                _logger.LogInformation("Ticket email sent successfully");
            }
            else
            {
                _logger.LogWarning("Event {EventId} not found after payment success!", eventId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in HandleCheckoutSessionCompleted: {Message}", ex.Message);
            throw; // Rethrow to let the main webhook handler catch it
        }
    }
}
