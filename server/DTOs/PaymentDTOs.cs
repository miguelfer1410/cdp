namespace CdpApi.DTOs;

public class AthletePaymentStatusDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Sport { get; set; } = string.Empty;
    public string PaymentPreference { get; set; } = string.Empty;
    public string CurrentPeriod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "Paid", "Pending", "Unpaid", "Late"
    public decimal Amount { get; set; }
    public PaymentDetailsDto? PaymentDetails { get; set; }
}

public class PaymentDetailsDto
{
    public int PaymentId { get; set; }
    public string Entity { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class ManualPaymentUpdateDto
{
    public int UserId { get; set; }
    public int? PeriodMonth { get; set; }
    public int PeriodYear { get; set; }
    public string Status { get; set; } = string.Empty; // "Completed", "Pending", "Failed"
}
