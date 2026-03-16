using Microsoft.AspNetCore.Mvc;
using CdpApi.Services;
using CdpApi.Data;
using Microsoft.EntityFrameworkCore;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ITicketService _ticketService;
    private readonly ApplicationDbContext _context;

    public TicketsController(
        IStripeService stripeService,
        ITicketService ticketService,
        ApplicationDbContext context)
    {
        _stripeService = stripeService;
        _ticketService = ticketService;
        _context = context;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutRequest request)
    {
        var gameEvent = await _context.Events.FindAsync(request.EventId);
        if (gameEvent == null) return NotFound("Evento não encontrado.");

        decimal price = gameEvent.TicketPriceNonSocio ?? 0;
        // In a real scenario, we'd check if the user is a socio and apply the correct price.
        // For now, using NonSocio price as default or request value.

        var sessionId = await _stripeService.CreateCheckoutSessionAsync(
            request.EventId.ToString(),
            request.BuyerEmail,
            request.BuyerName,
            price > 0 ? price : 5.0m, // Fallback price
            request.SuccessUrl,
            request.CancelUrl,
            null // No profiles metadata for this legacy endpoint
        );

        var sessionService = new Stripe.Checkout.SessionService();
        var session = await sessionService.GetAsync(sessionId);

        return Ok(new { sessionId, url = session.Url });
    }

    [HttpGet("verify/{code}")]
    public async Task<IActionResult> VerifyTicket(string code)
    {
        var ticket = await _ticketService.GetTicketByCodeAsync(code);
        if (ticket == null) return NotFound("Bilhete inválido.");

        return Ok(new
        {
            ticket.BuyerName,
            ticket.BuyerEmail,
            EventTitle = ticket.Event.Title,
            EventDate = ticket.Event.StartDateTime,
            ticket.Status
        });
    }

    [HttpPost("use/{code}")]
    public async Task<IActionResult> UseTicket(string code)
    {
        var success = await _ticketService.MarkTicketAsUsedAsync(code);
        if (!success) return BadRequest("Não foi possível validar o bilhete (pode já ter sido usado ou ser inválido).");

        return Ok("Bilhete validado com sucesso.");
    }
}

public class CreateCheckoutRequest
{
    public int EventId { get; set; }
    public string BuyerEmail { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
