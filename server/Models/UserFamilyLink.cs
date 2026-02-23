using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

/// <summary>
/// Represents a bidirectional family link between two users,
/// created by an admin to associate family members who may have different email addresses.
/// </summary>
public class UserFamilyLink
{
    [Key]
    public int Id { get; set; }

    /// <summary>The user who initiated (or whose side we represent).</summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>The linked family member.</summary>
    [Required]
    public int LinkedUserId { get; set; }
    
    [MaxLength(50)]
    public string? Relationship { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public User LinkedUser { get; set; } = null!;
}
