using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public DateTime? BirthDate { get; set; }

    [MaxLength(9)]
    public string? Nif { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    // Navigation properties for profiles
    public MemberProfile? MemberProfile { get; set; }
    public AthleteProfile? AthleteProfile { get; set; }
    public CoachProfile? CoachProfile { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLogin { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(100)]
    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetTokenExpires { get; set; }
}
