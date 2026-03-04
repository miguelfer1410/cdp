using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipCardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public MembershipCardController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadCard([FromQuery] int? userId = null)
    {
        var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();

        int authUserId = int.Parse(currentUserIdStr);
        int targetUserId = userId ?? authUserId;

        var user = await _context.Users
            .Include(u => u.MemberProfile)
            .Include(u => u.AthleteProfile)
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (user == null) return NotFound("Utilizador não encontrado.");
        if (user.MemberProfile == null) return BadRequest("Este utilizador não é sócio ativo.");

        // ── Dados ──────────────────────────────────────────────────────
        var fullName    = $"{user.FirstName} {user.LastName}".Trim();
        var memberNum   = user.MemberProfile.MembershipNumber?.ToString().PadLeft(6, '0')
                          ?? user.Id.ToString().PadLeft(6, '0');
        var memberYear  = user.MemberProfile.MemberSince?.Year.ToString()
                          ?? user.CreatedAt.Year.ToString();
        var sport       = user.AthleteProfile?.Escalao;
        bool isAtleta   = user.AthleteProfile != null;
        var statusLabels = new[] { "Pendente", "Ativo", "Suspenso", "Cancelado" };
        var statusLabel = statusLabels[(int)user.MemberProfile.MembershipStatus];
        bool isActive   = statusLabel == "Ativo";
        var validity    = "31/12/2026";

        // Logo
        var logoPath = Path.Combine(_env.WebRootPath, "CDP_logo.png");
        byte[]? logo = System.IO.File.Exists(logoPath)
            ? await System.IO.File.ReadAllBytesAsync(logoPath) : null;

        // QR Code (high density, black on white)
        string statusEmoji = statusLabel.Equals("Ativo", StringComparison.OrdinalIgnoreCase) ? "✅" : "❌";
        var qrText = $"{statusEmoji} SÓCIO: {statusLabel.ToUpper()}\n👤 Nome: {fullName}\n🆔 Nº Sócio: {memberNum}\n📅 Validade: {validity}";
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData  = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q);
        using var qrCode      = new PngByteQRCode(qrCodeData);
        byte[] qrCodeImage    = qrCode.GetGraphic(20);

        // ── Paleta (sem transparência — QuestPDF não suporta alpha) ────
        // Card: gradiente simulado com múltiplas faixas
        var cardTop    = Color.FromHex("#1a3f99");   // topo do gradiente
        var cardMid    = Color.FromHex("#0f2d6b");   // meio
        var cardBot    = Color.FromHex("#0d1e45");   // fundo
        var pageColor  = Colors.White;        // fundo da página branco
        var labelColor = Color.FromHex("#8baee8");   // labels (azul claro)
        var dimColor   = Color.FromHex("#6080b8");   // texto secundário
        var logoBox    = Color.FromHex("#1b3d82");
        var pillBg     = Color.FromHex("#1e4db5");
        var pillText   = Color.FromHex("#c8d8ff");
        var greenOk    = Color.FromHex("#059669");
        var orangePend = Color.FromHex("#d97706");
        var chipGold1  = Color.FromHex("#c8880e");
        var chipGold2  = Color.FromHex("#e8b820");
        var chipLine   = Color.FromHex("#7a4a00");

        // ISO credit-card: 85.6 × 54 mm
        float cardW = 242f;  // points (~85.6 mm)
        float cardH = 153f;  // points (~54 mm)

        // ── Documento ──────────────────────────────────────────────────
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(0);
                page.PageColor(pageColor);
                page.DefaultTextStyle(t => t.FontFamily(Fonts.Calibri).FontColor(Colors.White));

                // ── CONTEÚDO: card centrado + rodapé ───────────────────
                page.Content().AlignCenter().AlignMiddle().Column(col =>
                {
                    col.Spacing(0);

                    // ── CABEÇALHO DO DOCUMENTO ──────────────────────────
                    col.Item().PaddingBottom(24).AlignCenter().Column(hdr =>
                    {
                        hdr.Item().AlignCenter().Row(row =>
                        {
                            if (logo != null)
                                row.ConstantItem(32).Height(32).Element(e => e.Image(logo).FitArea());
                            row.ConstantItem(10);
                            row.AutoItem().AlignMiddle().Column(c =>
                            {
                                c.Item().Text("Clube Desportivo da Póvoa")
                                    .FontSize(13).Bold().FontColor(Colors.White);
                                c.Item().Text("Cartão de Sócio — Documento Oficial")
                                    .FontSize(8).FontColor(dimColor);
                            });
                        });
                    });

                    // ── CARTÃO ──────────────────────────────────────────
                    col.Item()
                        .Width(cardW)
                        .Height(cardH)
                        .Background(cardMid)
                        .Border(1).BorderColor(Color.FromHex("#2a4f9f"))
                        .Column(card =>
                        {
                            card.Spacing(0);

                            // Faixa de topo (gradiente simulado)
                            card.Item().Height(6).Background(cardTop);

                            // Conteúdo interno
                            card.Item().Padding(14).Column(inner =>
                            {
                                inner.Spacing(6);

                                // ── Linha 1: Logo | espaço | STATUS | TIPO ──
                                inner.Item().Row(r =>
                                {
                                    // Logo box
                                    r.ConstantItem(34).Height(24)
                                        .Background(logoBox)
                                        .Padding(3)
                                        .Element(e =>
                                        {
                                            if (logo != null) e.Image(logo).FitArea();
                                            else e.Text("CDP").FontSize(7).FontColor(Colors.White);
                                        });

                                    r.RelativeItem(); // spacer

                                    // Badge estado
                                    r.AutoItem().AlignMiddle()
                                        .Background(isActive ? greenOk : orangePend)
                                        .Padding(2).PaddingHorizontal(6)
                                        .Text($" {statusLabel} ")
                                        .FontSize(6).Bold().FontColor(Colors.White);

                                    r.ConstantItem(5);

                                    // Pill tipo
                                    r.AutoItem().AlignMiddle()
                                        .Background(pillBg)
                                        .Padding(2).PaddingHorizontal(6)
                                        .Text(isAtleta ? " ATLETA " : " SOCIO ")
                                        .FontSize(6).Bold().FontColor(pillText);
                                });

                                // ── Corpo: info esquerda + QR direita ──────
                                inner.Item().Row(body =>
                                {
                                    body.RelativeItem().Column(info =>
                                    {
                                        info.Spacing(7);

                                        // Número
                                        info.Item().Text(t =>
                                        {
                                            t.Span("Nº  ").FontSize(7).FontColor(labelColor);
                                            t.Span(memberNum).FontSize(18).Bold()
                                                .FontColor(Colors.White)
                                                .FontFamily("Courier New");
                                        });

                                        // Campos
                                        info.Item().Row(fields =>
                                        {
                                            fields.RelativeItem().Column(c =>
                                            {
                                                c.Item().Text("TITULAR").FontSize(5).FontColor(labelColor);
                                                c.Item().Text(fullName).FontSize(7.5f).Bold()
                                                    .FontColor(Colors.White);
                                            });

                                            if (sport != null)
                                            {
                                                fields.ConstantItem(8);
                                                fields.AutoItem().Column(c =>
                                                {
                                                    c.Item().Text("MODALIDADE").FontSize(5).FontColor(labelColor);
                                                    c.Item().Text(sport).FontSize(7.5f).Bold()
                                                        .FontColor(Colors.White);
                                                });
                                            }

                                            fields.ConstantItem(8);
                                            fields.ConstantItem(44).Column(c =>
                                            {
                                                c.Item().Text("VALIDO ATE").FontSize(5).FontColor(labelColor);
                                                c.Item().Text(validity).FontSize(7.5f).Bold()
                                                    .FontColor(Colors.White);
                                            });

                                            fields.ConstantItem(8);
                                            fields.ConstantItem(30).Column(c =>
                                            {
                                                c.Item().Text("DESDE").FontSize(5).FontColor(labelColor);
                                                c.Item().Text(memberYear).FontSize(7.5f).Bold()
                                                    .FontColor(Colors.White);
                                            });
                                        });
                                    });

                                    // QR Code à direita (ocupa altura total)
                                    body.ConstantItem(10);
                                    body.ConstantItem(85).Background(Colors.White)
                                        .Padding(4)
                                        .Element(e => e.Image(qrCodeImage).FitArea());
                                });
                            });

                            // Faixa de fundo (gradiente simulado)
                            card.Item().Height(4).Background(cardBot);
                        });

                    // ── RODAPÉ DO DOCUMENTO ─────────────────────────────
                    col.Item().PaddingTop(20).AlignCenter().Column(ftr =>
                    {
                        ftr.Item().AlignCenter()
                            .Text("Este cartão é pessoal e intransmissível. Apresente-o sempre que solicitado.")
                            .FontSize(7).Italic().FontColor(dimColor);
                        ftr.Item().AlignCenter()
                            .Text($"Gerado em {DateTime.Now:dd/MM/yyyy HH:mm} — Clube Desportivo da Póvoa © {DateTime.Now.Year}")
                            .FontSize(6.5f).FontColor(Color.FromHex("#4060a0"));
                    });
                });
            });
        });

        var pdfData = document.GeneratePdf();
        return File(pdfData, "application/pdf", $"Cartao_Socio_{user.Id}.pdf");
    }
}
