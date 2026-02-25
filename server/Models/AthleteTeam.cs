using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class AthleteTeam
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AthleteProfileId { get; set; }

    [Required]
    public int TeamId { get; set; }

    public int? JerseyNumber { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; } // Position in this specific team

    [MaxLength(50)]
    public string? LicenseNumber { get; set; } // Federation license for this sport

    public bool IsCaptain { get; set; } = false;

    // ── Inscrição ────────────────────────────────────────────────────────
    /// <summary>Indica se a taxa de inscrição já foi paga para esta equipa/época.</summary>
    public bool InscriptionPaid { get; set; } = false;

    /// <summary>Data em que a taxa de inscrição foi registada como paga.</summary>
    public DateTime? InscriptionPaidDate { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LeftAt { get; set; } // null if still active

    // Navigation properties
    public AthleteProfile AthleteProfile { get; set; } = null!;
    public Team Team { get; set; } = null!;
}