using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class MemberProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(20)]
    public string MembershipNumber { get; set; } = string.Empty; // Auto-generated unique number

    [Required]
    public MembershipStatus MembershipStatus { get; set; } = MembershipStatus.Pending;

    public DateTime? MemberSince { get; set; }

    [MaxLength(20)]
    public string? PaymentPreference { get; set; } // "Monthly" or "Annual"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
