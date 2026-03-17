using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class CoachTeam
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CoachProfileId { get; set; }

    [Required]
    public int TeamId { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public CoachProfile CoachProfile { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
