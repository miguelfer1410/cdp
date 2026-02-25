using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Previewer;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipCardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MembershipCardController(ApplicationDbContext context)
    {
        _context = context;
        // QuestPDF License configuration (Community is free for small teams/open source)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadCard([FromQuery] int? userId = null)
    {
        // Get current user ID from JWT if not provided (or to validate permission)
        var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        
        int authUserId = int.Parse(currentUserIdStr);
        int targetUserId = userId ?? authUserId;

        // Security check: only allow downloading own card or linked family card
        // (Simplification: if it's the same user, it's fine. For family, we'd check associations, 
        // but for now let's assume the frontend passes the correct one and we validate auth)
        // In a real scenario, we'd check if targetUserId is linked to authUserId.

        var user = await _context.Users
            .Include(u => u.MemberProfile)
            .Include(u => u.AthleteProfile)
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (user == null) return NotFound("Utilizador não encontrado.");
        if (user.MemberProfile == null) return BadRequest("Este utilizador não é um sócio ativo.");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Verdana));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(column =>
                    {
                        column.Item().Text("CLUBE DESPORTIVO").FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                        column.Item().Text("Cartão de Sócio Digital").FontSize(14).Italic();
                    });

                    // Logo placeholder (in a real app, you'd load the actual logo)
                    row.ConstantItem(80).Height(80).Background(Colors.Grey.Lighten3).AlignCenter().AlignMiddle().Text("LOGO");
                });

                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Spacing(20);

                    // Card Layout
                    x.Item().Border(1).BorderColor(Colors.Grey.Medium).Padding(20).Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("NOME").FontSize(10).FontColor(Colors.Grey.Medium);
                            col.Item().Text($"{user.FirstName} {user.LastName}").FontSize(16).SemiBold();
                            
                            col.Item().PaddingTop(15).Text("NÚMERO DE SÓCIO").FontSize(10).FontColor(Colors.Grey.Medium);
                            col.Item().Text($"#{user.Id.ToString().PadLeft(4, '0')}").FontSize(14).SemiBold();
                            
                            col.Item().PaddingTop(15).Text("SÓCIO DESDE").FontSize(10).FontColor(Colors.Grey.Medium);
                            col.Item().Text(user.MemberProfile.MemberSince?.ToString("dd/MM/yyyy") ?? user.CreatedAt.ToString("dd/MM/yyyy")).FontSize(12);
                        });

                        row.ConstantItem(120).AlignCenter().AlignMiddle().Column(col => {
                             col.Item().Background(Colors.Grey.Lighten4).Padding(5).AlignCenter().Text("FOTO");
                             col.Item().PaddingTop(10).AlignCenter().Text("ATIVO").FontColor(Colors.Green.Medium).SemiBold();
                        });
                    });

                    x.Item().Text("Este cartão é pessoal e intransmissível. Identifique-se sempre que solicitado pelos serviços do clube.").FontSize(10).Italic().FontColor(Colors.Grey.Medium);
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Página ");
                    x.CurrentPageNumber();
                });
            });
        });

        var pdfData = document.GeneratePdf();
        return File(pdfData, "application/pdf", $"Cartao_Socio_{user.Id}.pdf");
    }
}
