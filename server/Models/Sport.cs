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

    // ── Per-escalão monthly fees (quota JÁ INCLUÍDA quando QuotaIncluded = true) ─
    /// <summary>Mensalidade para Escalão 1 (normalmente isento = 0)</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao1Normal { get; set; } = 0;

    /// <summary>Mensalidade para Escalão 1 para irmãos / 2ª modalidade</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao1Sibling { get; set; } = 0;

    /// <summary>Mensalidade para Escalão 2 / escalão standard</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao2Normal { get; set; } = 0;

    /// <summary>Mensalidade para Escalão 2 para irmãos / 2ª modalidade</summary>
    [Range(0, 1000)]
    public decimal FeeEscalao2Sibling { get; set; } = 0;

    // ── Inscription fees ────────────────────────────────────────────────
    /// <summary>Taxa de inscrição normal (ex: 25€)</summary>
    [Range(0, 1000)]
    public decimal InscriptionFeeNormal { get; set; } = 0;

    /// <summary>Taxa de inscrição com desconto irmão / 2ª modalidade (ex: 20€)</summary>
    [Range(0, 1000)]
    public decimal InscriptionFeeDiscount { get; set; } = 0;

    // ── Quota inclusion flag ─────────────────────────────────────────────
    /// <summary>
    /// true  → mensalidade JÁ inclui a quota de sócio (Basquetebol, Voleibol, etc.)
    /// false → quota de sócio é adicionada por cima (Ténis de Mesa, Atletismo)
    /// </summary>
    public bool QuotaIncluded { get; set; } = true;

    // ── Payment Preference / Sibling logic ──────────────────────────────
    // SiblingDiscount removed in favor of fixed FeeEscalaoXSibling fields.

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}