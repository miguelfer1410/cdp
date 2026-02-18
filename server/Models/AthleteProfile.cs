using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class AthleteProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    // Name of the athlete (may differ from the account holder, e.g. parent's account with multiple children)
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    public int? Height { get; set; } // in cm

    public int? Weight { get; set; } // in kg

    public DateTime? MedicalCertificateExpiry { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<AthleteTeam> AthleteTeams { get; set; } = new List<AthleteTeam>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
