namespace CdpApi.DTOs;

public class AthletePaymentStatusDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Sport { get; set; } = string.Empty;
    public string PaymentPreference { get; set; } = string.Empty;
    public string MembershipNumber { get; set; } = string.Empty;
    public string CurrentPeriod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "Paid", "Pending", "Unpaid", "Late"
    public decimal Amount { get; set; }
    public decimal? AmountPaid { get; set; }
    public decimal? CustomQuotaPrice { get; set; }
    public PaymentDetailsDto? PaymentDetails { get; set; }
    public List<InscriptionInfoDto> PendingInscriptions { get; set; } = new();
}

public class InscriptionInfoDto
{
    public int AthleteTeamId { get; set; }
    public string SportName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool Paid { get; set; }
    public DateTime? PaymentDate { get; set; }
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
    public List<ManualPaymentPeriodDto>? SelectedPeriods { get; set; }
    public int PeriodYear { get; set; }
    public string Status { get; set; } = string.Empty; // "Completed", "Pending", "Failed"
    public List<int>? MarkInscriptionsPaid { get; set; } // List of AthleteTeamIds
}

public class ManualPaymentPeriodDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
}

public class UpdateMembershipNumberDto
{
    public int UserId { get; set; }
    public string MembershipNumber { get; set; } = string.Empty;
}

public class MarkWithdrawnDto
{
    public int UserId { get; set; }
}

public class GlobalPaymentExportDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Nif { get; set; } = string.Empty;
    public string MembershipNumber { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Sport { get; set; } = string.Empty;
    public string PaymentPreference { get; set; } = string.Empty;
    public string[] MonthlyStatus { get; set; } = new string[12];
    public int Year { get; set; }
}
public class UpdateCustomQuotaPriceDto
{
    public int UserId { get; set; }
    public decimal? CustomQuotaPrice { get; set; }
}
