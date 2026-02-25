using System.ComponentModel.DataAnnotations;

namespace CdpApi.Models;

public class Sport
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    // ── Legacy / fallback fee (kept for backward compatibility) ──────────
    [Range(0, 1000)]
    public decimal MonthlyFee { get; set; } = 0;

    // ── Per-escalão monthly fees ─────────────────────────────────────────
    /// <summary>Mensalidade Sem Escalão (normal)</summary>
    [Range(0, 1000)]
    public decimal FeeNormalNormal { get; set; } = 0;

    /// <summary>Mensalidade Escalão 1</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao1Normal { get; set; } = 0;

    /// <summary>Mensalidade Escalão 2</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao2Normal { get; set; } = 0;

    /// <summary>Preço único para irmão / 2ª modalidade (aplica-se a qualquer escalão)</summary>
    [Range(0, 1000)]
    public decimal FeeDiscount { get; set; } = 0;

    // ── Inscription fee ──────────────────────────────────────────────────
    /// <summary>Taxa de inscrição</summary>
    [Range(0, 1000)]
    public decimal InscriptionFeeNormal { get; set; } = 0;

    // ── Quota inclusion flag ─────────────────────────────────────────────
    /// <summary>
    /// true  → mensalidade JÁ inclui a quota de sócio (Basquetebol, Voleibol, etc.)
    /// false → quota de sócio é adicionada por cima (Ténis de Mesa, Atletismo)
    /// </summary>
    public bool QuotaIncluded { get; set; } = true;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}