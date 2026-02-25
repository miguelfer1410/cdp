using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public enum EscalaoRequestStatus
{
    Pending  = 0,
    Accepted = 1,
    Rejected = 2
}

public class EscalaoRequest
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AthleteProfileId { get; set; }

    /// <summary>Caminho para o ficheiro PDF do comprovativo (/uploads/escalao/...)</summary>
    [Required]
    [MaxLength(500)]
    public string DocumentUrl { get; set; } = string.Empty;

    public EscalaoRequestStatus Status { get; set; } = EscalaoRequestStatus.Pending;

    /// <summary>Nota do admin ao aceitar/recusar (opcional)</summary>
    [MaxLength(500)]
    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }

    public int? ReviewedByUserId { get; set; }

    // Navigation
    public AthleteProfile AthleteProfile { get; set; } = null!;
}