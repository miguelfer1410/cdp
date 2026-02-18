using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public enum EventType
{
    Game = 1,
    Training = 2,
    Other = 3
}

public class Event
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public EventType EventType { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    public int? TeamId { get; set; } // Nullable for club-wide events

    [Required]
    public int SportId { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    // Game-specific fields
    [MaxLength(100)]
    public string? OpponentName { get; set; } // For games only

    public bool? IsHomeGame { get; set; } // For games only

    // Audit fields
    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Team? Team { get; set; }
    public Sport Sport { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
