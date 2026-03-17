using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class Team
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SportId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // "Juniores A", "Seniores Femininos"

    public int? EscalaoId { get; set; } // Foreign key to Escalao
    public Escalao? Escalao { get; set; }

    [Required]
    public Gender Gender { get; set; } = Gender.Mixed;

    [MaxLength(20)]
    public string? Season { get; set; } // "2024/2025"

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Sport Sport { get; set; } = null!;
    public ICollection<AthleteTeam> AthleteTeams { get; set; } = new List<AthleteTeam>();
    public ICollection<CoachTeam> CoachTeams { get; set; } = new List<CoachTeam>();
}
