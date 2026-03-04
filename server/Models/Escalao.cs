using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class Escalao
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<EscalaoSport> EscalaoSports { get; set; } = new List<EscalaoSport>();
}
