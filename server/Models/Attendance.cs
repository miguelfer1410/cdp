using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CdpApi.Models;

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Injured = 4,
    Excused = 5 // Justificou a falta
}

public class Attendance
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int AthleteId { get; set; }

    [Required]
    public AttendanceStatus Status { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; } // Reason for absence/lateness

    // Audit fields
    public int RecordedBy { get; set; } // User ID of the coach/admin who recorded it

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]
    public Event Event { get; set; } = null!;

    [JsonIgnore]
    public AthleteProfile Athlete { get; set; } = null!;
}
