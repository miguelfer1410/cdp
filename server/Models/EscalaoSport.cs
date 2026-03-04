using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class EscalaoSport
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int EscalaoId { get; set; }

    [Required]
    public int SportId { get; set; }

    // Navigation properties
    public Escalao Escalao { get; set; } = null!;
    public Sport Sport { get; set; } = null!;
}
