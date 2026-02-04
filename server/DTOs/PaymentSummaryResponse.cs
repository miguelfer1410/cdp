namespace CdpApi.DTOs;

public class PaymentSummaryResponse
{
    public decimal MonthlyFee { get; set; }
    public DateTime? LastPaymentDate { get; set; }
    public DateTime? NextPaymentDue { get; set; }
    public string PaymentStatus { get; set; } = string.Empty; // "Em Dia", "Atrasado", "Pendente"
    public int TotalPayments { get; set; }
    public decimal TotalPaid { get; set; }
}
