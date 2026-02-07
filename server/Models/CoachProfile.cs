using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class CoachProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int SportId { get; set; }

    public int? TeamId { get; set; } // Primary team they coach (optional)

    [MaxLength(50)]
    public string? LicenseNumber { get; set; }

    [MaxLength(20)]
    public string? LicenseLevel { get; set; } // "Nível 1", "Nível 2", etc.

    public DateTime? LicenseExpiry { get; set; }

    [MaxLength(100)]
    public string? Specialization { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Sport Sport { get; set; } = null!;
    public Team? Team { get; set; }
}
