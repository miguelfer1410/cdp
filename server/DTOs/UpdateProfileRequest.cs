using System.ComponentModel.DataAnnotations;

namespace CdpApi.DTOs;

public class UpdateProfileRequest
{
    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(9)]
    public string? Nif { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(10)]
    public string? PostalCode { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }
}
