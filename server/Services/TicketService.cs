using CdpApi.Data;
using CdpApi.Models;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace CdpApi.Services;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TicketService> _logger;

    public TicketService(ApplicationDbContext context, ILogger<TicketService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Ticket> CreateTicketAsync(int eventId, string buyerEmail, string buyerName, decimal price, string stripeSessionId, int? userId = null)
    {
        var ticket = new Ticket
        {
            EventId = eventId,
            UserId = userId,
            BuyerEmail = buyerEmail,
            BuyerName = buyerName,
            Price = price,
            StripeSessionId = stripeSessionId,
            TicketCode = Guid.NewGuid().ToString("N").ToUpper(), // Generate unique ticket code
            Status = TicketStatus.Active,
            PurchaseDate = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return ticket;
    }

    public Task<byte[]> GenerateQrCodeAsync(string ticketCode)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(ticketCode, QRCodeGenerator.ECCLevel.Q);
        using var pngByteQrCode = new PngByteQRCode(qrCodeData);
        return Task.FromResult(pngByteQrCode.GetGraphic(20));
    }

    public async Task<Ticket?> GetTicketByCodeAsync(string ticketCode)
    {
        return await _context.Tickets
            .Include(t => t.Event)
            .FirstOrDefaultAsync(t => t.TicketCode == ticketCode);
    }

    public async Task<bool> MarkTicketAsUsedAsync(string ticketCode)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.TicketCode == ticketCode);
        if (ticket == null || ticket.Status != TicketStatus.Active)
            return false;

        ticket.Status = TicketStatus.Used;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
