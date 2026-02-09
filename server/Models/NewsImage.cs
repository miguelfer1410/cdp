using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CdpApi.Models;

public class NewsImage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int NewsArticleId { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    public int Order { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property - JsonIgnore to prevent serialization cycles
    [JsonIgnore]
    public NewsArticle? NewsArticle { get; set; }
}
