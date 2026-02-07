using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class AthleteProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public int? Height { get; set; } // in cm

    public int? Weight { get; set; } // in kg

    public DateTime? MedicalCertificateExpiry { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<AthleteTeam> AthleteTeams { get; set; } = new List<AthleteTeam>();
}
