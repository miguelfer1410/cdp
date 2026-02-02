namespace CdpApi.DTOs;

public class UserProfileResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? City { get; set; }
    public string UserType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
