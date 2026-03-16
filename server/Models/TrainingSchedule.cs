using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CdpApi.Models;

public class TrainingSchedule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TeamId { get; set; }

    // Substitui os campos DaysOfWeek, StartTime, EndTime por:
    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string DaySchedules { get; set; } = "[]"; // JSON: [{day, startTime, endTime}]

    [MaxLength(200)]
    public string? Location { get; set; }

    [Required]
    public DateTime ValidFrom { get; set; }

    [Required]
    public DateTime ValidUntil { get; set; }

    public bool IsActive { get; set; } = true;

    // Audit fields
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Team Team { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
