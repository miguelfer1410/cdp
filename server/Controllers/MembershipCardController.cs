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

        // ── Dados ─────────────────────────────────────────────────────
        var fullName     = $"{user.FirstName} {user.LastName}".Trim();
        var memberNum    = user.MemberProfile.MembershipNumber?.ToString().PadLeft(6, '0')
                           ?? user.Id.ToString().PadLeft(6, '0');
        var memberSince  = user.MemberProfile.MemberSince?.ToString("dd/MM/yyyy")
                           ?? user.CreatedAt.ToString("dd/MM/yyyy");
        var memberYear   = user.MemberProfile.MemberSince?.Year.ToString()
                           ?? user.CreatedAt.Year.ToString();
        var sport        = user.AthleteProfile?.Escalao;
        bool isAtleta    = user.AthleteProfile != null;
        var statusLabels = new[] { "Pendente", "Ativo", "Suspenso", "Cancelado" };
        var statusLabel  = statusLabels[(int)user.MemberProfile.MembershipStatus];
        bool isActive    = statusLabel == "Ativo";
        var validity     = "31/12/2026";

        // Logo
        var logoPath = Path.Combine(_env.WebRootPath, "CDP_logo.png");
        byte[]? logo = System.IO.File.Exists(logoPath)
            ? await System.IO.File.ReadAllBytesAsync(logoPath) : null;

        // QR Code
        var qrUrl = $"http://localhost:3000/verify/{user.Id}";
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(qrUrl, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrCodeImage = qrCode.GetGraphic(20);

        // ── Cores ─────────────────────────────────────────────────────
        var navyDeep  = Color.FromHex("#0d1e45");
        var navyCard  = Color.FromHex("#0f2d6b");
        var navyBack  = Color.FromHex("#091a40");
        var labelGrey = Color.FromHex("#94a3b8");
        var bgPage    = Color.FromHex("#eef2ff");
        var greenOk   = Color.FromHex("#059669");
        var chipBlue  = Color.FromHex("#1a3f99");
        var chipLine  = Color.FromHex("#2d5cb8");  // solid, sem alpha
        var badgeBlue = Color.FromHex("#2554c7");
        var logoBox   = Color.FromHex("#1b3d82");  // solid para caixa do logo
        var pillBg    = Color.FromHex("#1e4db5");  // solid para pill tipo
        var pillText  = Color.FromHex("#c8d8ff");  // solid para texto pill

        // ── Documento ─────────────────────────────────────────────────
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(bgPage);
                page.DefaultTextStyle(t => t.FontFamily(Fonts.Calibri).FontSize(10)
                    .FontColor(Colors.Grey.Darken4));

                // ── CABEÇALHO ────────────────────────────────────────
                page.Header().PaddingBottom(14).Row(hRow =>
                {
                    hRow.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Clube Desportivo da Póvoa")
                            .FontSize(14).Bold().FontColor(navyDeep);
                        col.Item().Text("Cartão de Sócio Digital — Documento Oficial")
                            .FontSize(9).FontColor(labelGrey);
                    });
                    hRow.ConstantItem(55).Height(38).AlignRight().AlignMiddle()
                        .Element(e =>
                        {
                            if (logo != null) e.Image(logo).FitArea();
                            else e.Background(Color.FromHex("#e2e8f0"));
                        });
                });

                // ── CONTEÚDO ─────────────────────────────────────────
                page.Content().Column(content =>
                {
                    content.Spacing(16);

                    // ─── CARD FRENTE ──────────────────────────────────
                    content.Item().MinHeight(220).Background(navyCard).Padding(28).Column(card =>
                    {
                        card.Spacing(10);

                        // Linha 1: Logo | espaço | STATUS | TIPO
                        card.Item().Row(r =>
                        {
                            // Logo (sem caixa com cor de fundo para evitar artefactos)
                            r.ConstantItem(44).Height(30)
                                .Background(logoBox)
                                .Padding(4)
                                .Element(e =>
                                {
                                    if (logo != null) e.Image(logo).FitArea();
                                    else e.Text("CDP").FontSize(9).FontColor(Colors.White);
                                });

                            // Spacer
                            r.ConstantItem(10);
                            r.RelativeItem();

                            // Status pill
                            r.AutoItem().AlignMiddle()
                                .Background(isActive ? greenOk : badgeBlue)
                                .Padding(3).PaddingHorizontal(7)
                                .Text($"  {statusLabel}  ")
                                .FontSize(7).Bold().FontColor(Colors.White);

                            r.ConstantItem(6);

                            // Tipo
                            r.AutoItem().AlignMiddle()
                                .Background(pillBg)
                                .Padding(3).PaddingHorizontal(7)
                                .Text(isAtleta ? "  ATLETA  " : "  SOCIO  ")
                                .FontSize(7).Bold()
                                .FontColor(pillText);
                        });

                        // Número de sócio
                        card.Item().PaddingTop(14).Text(text =>
                        {
                            text.Span("No.  ").FontSize(9).FontColor(Color.FromHex("#8baee8"));
                            text.Span(memberNum).FontSize(22).Bold().FontColor(Colors.White);
                        });

                        // Campos
                        card.Item().Row(r =>
                        {
                            r.RelativeItem().Column(col =>
                            {
                                col.Item().Text("TITULAR").FontSize(6).FontColor(labelGrey);
                                col.Item().Text(fullName).FontSize(9).Bold().FontColor(Colors.White);
                            });

                            if (sport != null)
                            {
                                r.ConstantItem(10);
                                r.AutoItem().Column(col =>
                                {
                                    col.Item().Text("MODALIDADE").FontSize(6).FontColor(labelGrey);
                                    col.Item().Text(sport).FontSize(9).Bold().FontColor(Colors.White);
                                });
                            }

                            r.ConstantItem(10);
                            r.ConstantItem(56).Column(col =>
                            {
                                col.Item().Text("VALIDO ATE").FontSize(6).FontColor(labelGrey);
                                col.Item().Text(validity).FontSize(9).Bold().FontColor(Colors.White);
                            });

                            r.ConstantItem(10);
                            r.ConstantItem(40).Column(col =>
                            {
                                col.Item().Text("DESDE").FontSize(6).FontColor(labelGrey);
                                col.Item().Text(memberYear).FontSize(9).Bold().FontColor(Colors.White);
                            });
                        });
                    });

                    // ─── CARD VERSO ───────────────────────────────────
                    content.Item().MinHeight(220).Background(navyBack).Column(back =>
                    {
                        // Banda magnética
                        back.Item().Height(26).Background(Color.FromHex("#080808"));

                        // Corpo
                        back.Item().Padding(28).Column(body =>
                        {
                            body.Spacing(10);

                            // Logo + nome do clube
                            body.Item().Row(r =>
                            {
                                r.ConstantItem(28).Height(20)
                                    .Background(logoBox)
                                    .Padding(3)
                                    .Element(e =>
                                    {
                                        if (logo != null) e.Image(logo).FitArea();
                                        else e.Text("CDP").FontSize(7).FontColor(Colors.White);
                                    });
                                r.ConstantItem(8);
                                r.RelativeItem().AlignMiddle()
                                    .Text("CLUBE DESPORTIVO DA POVOA")
                                    .FontSize(7).Bold().FontColor(Color.FromHex("#8baee8"));
                            });

                            // Campos em duas colunas e QR Code
                            body.Item().Row(r =>
                            {
                                r.RelativeItem().Column(col =>
                                {
                                    BField(col, "No. DE SOCIO", $"#{memberNum}");
                                    BField(col, "TITULAR", fullName);
                                    if (sport != null) BField(col, "MODALIDADE", sport);
                                });
                                r.ConstantItem(16);
                                r.RelativeItem().Column(col =>
                                {
                                    BField(col, "MEMBRO DESDE", memberSince);
                                    BField(col, "VALIDADE", validity);
                                    BField(col, "ESTADO", statusLabel,
                                        isActive ? Color.FromHex("#6ee7b7") : Color.FromHex("#fcd34d"));
                                });
                                r.ConstantItem(16);
                                r.ConstantItem(48).Height(48).Background(Colors.White).Padding(2).Element(e =>
                                {
                                    e.Image(qrCodeImage).FitArea();
                                });
                            });

                            body.Item()
                                .Text("Este cartao e pessoal e intransmissivel. Apresente-o sempre que solicitado.")
                                .FontSize(6).Italic().FontColor(Color.FromHex("#4a6da0"));
                        });
                    });

                    // ─── Nota de rodapé ───────────────────────────────
                    content.Item().AlignCenter()
                        .Text($"Gerado em {DateTime.Now:dd/MM/yyyy HH:mm} — Clube Desportivo da Povoa (c) {DateTime.Now.Year}")
                        .FontSize(7).Italic().FontColor(labelGrey);
                });

                // ── FOOTER ───────────────────────────────────────────
                page.Footer()
                    .BorderTop(1).BorderColor(Color.FromHex("#e2e8f0"))
                    .PaddingTop(6)
                    .Row(r =>
                    {
                        r.RelativeItem()
                            .Text($"Gerado em {DateTime.Now:dd/MM/yyyy HH:mm}")
                            .FontSize(8).FontColor(labelGrey);
                        r.RelativeItem().AlignRight().Text(t =>
                        {
                            t.Span("Pagina ").FontSize(8).FontColor(labelGrey);
                            t.CurrentPageNumber().FontSize(8).FontColor(labelGrey);
                        });
                    });
            });
        });

        var pdfData = document.GeneratePdf();
        return File(pdfData, "application/pdf", $"Cartao_Socio_{user.Id}.pdf");
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private static void BField(ColumnDescriptor col, string label, string value, string? vc = null)
    {
        col.Item().PaddingBottom(7).Column(c =>
        {
            c.Item().Text(label).FontSize(5.5f).FontColor(Color.FromHex("#94a3b8"));
            c.Item().Text(value).FontSize(9).Bold().FontColor(vc ?? Colors.White);
        });
    }

    private static void IRow(ColumnDescriptor col, string label, string value)
    {
        col.Item().PaddingBottom(8).Column(c =>
        {
            c.Item().Text(label).FontSize(8).FontColor(Color.FromHex("#6b7280"));
            c.Item().Text(value).FontSize(10).Bold().FontColor(Color.FromHex("#111827"));
        });
    }
}
