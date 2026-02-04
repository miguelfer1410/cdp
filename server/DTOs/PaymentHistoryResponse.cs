namespace CdpApi.DTOs;

public class PaymentHistoryResponse
{
    public int Id { get; set; }
    public string Month { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
}
