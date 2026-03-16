using CdpApi.Models;

namespace CdpApi.Services;

public interface ITicketService
{
    Task<Ticket> CreateTicketAsync(int eventId, string buyerEmail, string buyerName, decimal price, string stripeSessionId, int? userId = null);
    Task<byte[]> GenerateQrCodeAsync(string ticketCode);
    Task<Ticket?> GetTicketByCodeAsync(string ticketCode);
    Task<bool> MarkTicketAsUsedAsync(string ticketCode);
}
