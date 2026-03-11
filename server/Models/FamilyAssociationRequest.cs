using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class FamilyAssociationRequest
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RequesterId { get; set; }

    // Info submitted by the user about the family member they want associated
    [Required]
    [MaxLength(200)]
    public string FamilyMemberName { get; set; } = string.Empty;

    [MaxLength(9)]
    public string? FamilyMemberNif { get; set; }

    public DateTime? FamilyMemberBirthDate { get; set; }

    [MaxLength(500)]
    public string? RequesterMessage { get; set; }

    public FamilyAssociationRequestStatus Status { get; set; } = FamilyAssociationRequestStatus.Pending;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SeenAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(500)]
    public string? AdminNote { get; set; }

    // Navigation properties
    public User Requester { get; set; } = null!;
}

public enum FamilyAssociationRequestStatus
{
    Pending = 0,
    Seen = 1,
    Accepted = 2,
    Rejected = 3
}
