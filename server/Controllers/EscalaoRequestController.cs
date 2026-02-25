using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.Services;
using System.Security.Claims;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/escalao-requests")]
public class EscalaoRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly ILogger<EscalaoRequestsController> _logger;

    public EscalaoRequestsController(
        ApplicationDbContext context,
        IImageService imageService,
        ILogger<EscalaoRequestsController> logger)
    {
        _context = context;
        _imageService = imageService;
        _logger = logger;
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private async Task<int?> GetAuthorizedUserIdAsync(int? requestedUserId)
    {
        var loggedInIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(loggedInIdClaim) || !int.TryParse(loggedInIdClaim, out int loggedInId))
            return null;

        if (!requestedUserId.HasValue || requestedUserId.Value == loggedInId)
            return loggedInId;

        var loggedInUser = await _context.Users.FindAsync(loggedInId);
        var requestedUser = await _context.Users.FindAsync(requestedUserId.Value);
        if (loggedInUser == null || requestedUser == null) return null;

        var GetBase = (string email) =>
        {
            var atIndex = email.ToLower().LastIndexOf('@');
            if (atIndex < 0) return email.ToLower();
            var local = email.Substring(0, atIndex).ToLower();
            var domain = email.Substring(atIndex).ToLower();
            var plusIndex = local.IndexOf('+');
            return (plusIndex >= 0 ? local.Substring(0, plusIndex) : local) + domain;
        };

        if (GetBase(loggedInUser.Email) != GetBase(requestedUser.Email))
            return null;

        return requestedUserId.Value;
    }

    // ── POST: api/escalao-requests  (Atleta submete comprovativo) ────────────
    [HttpPost]
    [Authorize]
    public async Task<ActionResult> Submit([FromForm] SubmitEscalaoRequest request)
    {
        try
        {
            var targetUserId = await GetAuthorizedUserIdAsync(request.UserId);
            if (targetUserId == null)
                return Unauthorized(new { message = "Não tens permissão para este perfil." });

            var athleteProfile = await _context.AthleteProfiles
                .FirstOrDefaultAsync(ap => ap.UserId == targetUserId);

            if (athleteProfile == null)
                return BadRequest(new { message = "Perfil de atleta não encontrado." });

            // Validate file
            if (request.Document == null || request.Document.Length == 0)
                return BadRequest(new { message = "Documento obrigatório." });

            var ext = Path.GetExtension(request.Document.FileName).ToLower();
            if (ext != ".pdf")
                return BadRequest(new { message = "Apenas ficheiros PDF são aceites." });

            if (request.Document.Length > 5 * 1024 * 1024) // 5MB
                return BadRequest(new { message = "O ficheiro não pode exceder 5MB." });

            // Check for existing pending request
            var existing = await _context.EscalaoRequests
                .Where(r => r.AthleteProfileId == athleteProfile.Id && r.Status == EscalaoRequestStatus.Pending)
                .FirstOrDefaultAsync();

            if (existing != null)
                return BadRequest(new { message = "Já tens um pedido pendente para este atleta. Aguarda a resposta do administrador." });

            // Save PDF
            var documentUrl = await SavePdfAsync(request.Document);

            var escalaoRequest = new EscalaoRequest
            {
                AthleteProfileId = athleteProfile.Id,
                DocumentUrl      = documentUrl,
                Status           = EscalaoRequestStatus.Pending,
                CreatedAt        = DateTime.UtcNow
            };

            _context.EscalaoRequests.Add(escalaoRequest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pedido enviado com sucesso. O administrador irá analisar o comprovativo." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting escalao request");
            return StatusCode(500, new { message = "Erro ao enviar pedido." });
        }
    }

    // ── GET: api/escalao-requests/my  (Atleta vê os seus próprios pedidos) ───
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult> GetMyRequests([FromQuery] int? userId)
    {
        var targetUserId = await GetAuthorizedUserIdAsync(userId);
        if (targetUserId == null)
            return Unauthorized(new { message = "Não tens permissão para ver estes pedidos." });

        var athleteProfile = await _context.AthleteProfiles
            .FirstOrDefaultAsync(ap => ap.UserId == targetUserId);

        if (athleteProfile == null) return Ok(new List<object>());

        var requests = await _context.EscalaoRequests
            .Where(r => r.AthleteProfileId == athleteProfile.Id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.AdminNote,
                r.CreatedAt,
                r.ReviewedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    // ── GET: api/escalao-requests  (Admin lista todos) ───────────────────────
    [HttpGet]
    [Authorize]
    public async Task<ActionResult> GetAll([FromQuery] string status = "Pending")
    {
        var statusEnum = status switch
        {
            "Accepted" => (EscalaoRequestStatus?)EscalaoRequestStatus.Accepted,
            "Rejected" => (EscalaoRequestStatus?)EscalaoRequestStatus.Rejected,
            _          => (EscalaoRequestStatus?)EscalaoRequestStatus.Pending
        };

        var query = _context.EscalaoRequests
            .Include(r => r.AthleteProfile)
                .ThenInclude(ap => ap.User)
            .AsQueryable();

        if (statusEnum.HasValue)
            query = query.Where(r => r.Status == statusEnum.Value);

        var results = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.DocumentUrl,
                r.AdminNote,
                r.CreatedAt,
                r.ReviewedAt,
                athleteProfileId = r.AthleteProfileId,
                escalaoAtual     = r.AthleteProfile.Escalao,
                athlete = new
                {
                    id        = r.AthleteProfile.Id,
                    userId    = r.AthleteProfile.UserId,
                    firstName = r.AthleteProfile.User.FirstName,
                    lastName  = r.AthleteProfile.User.LastName,
                    email     = r.AthleteProfile.User.Email
                }
            })
            .ToListAsync();

        return Ok(results);
    }

    // ── PATCH: api/escalao-requests/{id}/review  (Admin aceita/recusa) ───────
    [HttpPatch("{id}/review")]
    [Authorize]
    public async Task<ActionResult> Review(int id, [FromBody] ReviewEscalaoRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int adminUserId)) return Unauthorized();

            var escalaoRequest = await _context.EscalaoRequests
                .Include(r => r.AthleteProfile)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (escalaoRequest == null)
                return NotFound(new { message = "Pedido não encontrado." });

            if (escalaoRequest.Status != EscalaoRequestStatus.Pending)
                return BadRequest(new { message = "Este pedido já foi processado." });

            escalaoRequest.Status           = request.Accept ? EscalaoRequestStatus.Accepted : EscalaoRequestStatus.Rejected;
            escalaoRequest.AdminNote        = request.Note;
            escalaoRequest.ReviewedAt       = DateTime.UtcNow;
            escalaoRequest.ReviewedByUserId = adminUserId;

            // If accepted → assign chosen escalão (defaults to "Escalão 1" for backward compat if not sent)
            if (request.Accept)
            {
                var targetEscalao = string.IsNullOrEmpty(request.Escalao) ? "Escalão 1" : request.Escalao;
                escalaoRequest.AthleteProfile.Escalao = targetEscalao;
            }

            await _context.SaveChangesAsync();

            string msg = request.Accept 
                ? $"{escalaoRequest.AthleteProfile.Escalao} atribuído ao atleta." 
                : "Pedido recusado.";

            return Ok(new { message = msg });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reviewing escalao request {Id}", id);
            return StatusCode(500, new { message = "Erro ao processar pedido." });
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private async Task<string> SavePdfAsync(IFormFile file)
    {
        var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var folder = Path.Combine(webRootPath, "uploads", "escalao");

        if (!Directory.Exists(folder))
            Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid()}.pdf";
        var filePath = Path.Combine(folder, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/escalao/{fileName}";
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
public class SubmitEscalaoRequest
{
    public IFormFile? Document { get; set; }
    public int? UserId { get; set; }
}

public class ReviewEscalaoRequest
{
    public bool Accept { get; set; }
    public string? Note { get; set; }
    public string? Escalao { get; set; }
}
