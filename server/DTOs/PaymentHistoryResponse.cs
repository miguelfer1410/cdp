namespace CdpApi.DTOs;

public class PaymentHistoryResponse
{
    public int Id { get; set; }
    public string Month { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? PeriodMonth { get; set; }
    public int PeriodYear { get; set; }
    public string? Entity { get; set; }
    public string? Reference { get; set; }
    public string? PaymentMethod { get; set; }
}
