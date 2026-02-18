using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CdpApi.Models
{
    public class GameCallUp
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EventId { get; set; }

        [ForeignKey("EventId")]
        public virtual Event Event { get; set; }

        [Required]
        public int AthleteId { get; set; }

        [ForeignKey("AthleteId")]
        public virtual AthleteProfile Athlete { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
