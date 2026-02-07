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

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LeftAt { get; set; } // null if still active

    // Navigation properties
    public AthleteProfile AthleteProfile { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
