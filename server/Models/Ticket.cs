using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public enum TicketStatus
{
    Active = 1,
    Used = 2,
    Cancelled = 3
}

public class Ticket
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EventId { get; set; }

    public int? UserId { get; set; } // Nullable for guest checkout if needed

    [Required]
    [MaxLength(255)]
    public string BuyerEmail { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BuyerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TicketCode { get; set; } = string.Empty; // Unique code for QR

    [Required]
    public decimal Price { get; set; }

    [Required]
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    [Required]
    public TicketStatus Status { get; set; } = TicketStatus.Active;

    [MaxLength(255)]
    public string? StripeSessionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Event Event { get; set; } = null!;
    public User? User { get; set; }
}
