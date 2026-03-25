using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using System.Security.Claims;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/family-associations")]
[Authorize]
public class FamilyAssociationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FamilyAssociationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ────────────────────────────────────────────────────────────────────────────
    // HELPER: resolve which userId the caller is authorised to access
    // ────────────────────────────────────────────────────────────────────────────
    private async Task<int?> GetAuthorizedUserIdAsync(int? requestedUserId)
    {
        var loggedInIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
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

    // POST: api/family-associations/request
    // Any authenticated user submits a request
    [HttpPost("request")]
    public async Task<IActionResult> SubmitRequest([FromBody] FamilyAssociationRequestDto request)
    {
        var targetUserId = await GetAuthorizedUserIdAsync(request.UserId);
        if (targetUserId == null)
            return Unauthorized(new { message = "Não tens permissão para este perfil." });

        if (string.IsNullOrWhiteSpace(request.FamilyMemberName))
            return BadRequest(new { message = "Nome do familiar é obrigatório" });

        var newRequest = new FamilyAssociationRequest
        {
            RequesterId = targetUserId.Value,
            FamilyMemberName = request.FamilyMemberName.Trim(),
            FamilyMemberNif = request.FamilyMemberNif?.Trim(),
            FamilyMemberBirthDate = request.FamilyMemberBirthDate,
            RequesterMessage = request.RequesterMessage?.Trim(),
            Status = FamilyAssociationRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        _context.FamilyAssociationRequests.Add(newRequest);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Requisição enviada com sucesso", id = newRequest.Id });
    }

    // GET: api/family-associations/my-requests
    // Returns current user's own submitted requests
    [HttpGet("my-requests")]
    public async Task<ActionResult<IEnumerable<FamilyRequestResponse>>> GetMyRequests([FromQuery] int? userId)
    {
        var targetUserId = await GetAuthorizedUserIdAsync(userId);
        if (targetUserId == null)
            return Unauthorized(new { message = "Não tens permissão para ver estes pedidos." });

        var requests = await _context.FamilyAssociationRequests
            .Where(r => r.RequesterId == targetUserId.Value)
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FamilyRequestResponse
            {
                Id = r.Id,
                FamilyMemberName = r.FamilyMemberName,
                FamilyMemberNif = r.FamilyMemberNif,
                FamilyMemberBirthDate = r.FamilyMemberBirthDate,
                RequesterMessage = r.RequesterMessage,
                Status = r.Status.ToString(),
                RequestedAt = r.RequestedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    // GET: api/family-associations
    // Admin only — returns all requests
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<FamilyRequestAdminResponse>>> GetAllRequests(
        [FromQuery] string? status = null)
    {
        var query = _context.FamilyAssociationRequests
            .Include(r => r.Requester)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<FamilyAssociationRequestStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new FamilyRequestAdminResponse
            {
                Id = r.Id,
                RequesterId = r.RequesterId,
                RequesterName = $"{r.Requester.FirstName} {r.Requester.LastName}",
                RequesterEmail = r.Requester.Email,
                FamilyMemberName = r.FamilyMemberName,
                FamilyMemberNif = r.FamilyMemberNif,
                FamilyMemberBirthDate = r.FamilyMemberBirthDate,
                RequesterMessage = r.RequesterMessage,
                Status = r.Status.ToString(),
                RequestedAt = r.RequestedAt,
                SeenAt = r.SeenAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    // PATCH: api/family-associations/{id}/seen
    // Admin marks a request as seen
    [HttpPatch("{id}/seen")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkAsSeen(int id)
    {
        var request = await _context.FamilyAssociationRequests.FindAsync(id);

        if (request == null)
            return NotFound(new { message = "Requisição não encontrada" });

        request.Status = FamilyAssociationRequestStatus.Seen;
        request.SeenAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Requisição marcada como vista" });
    }

    // POST: api/family-associations/{id}/accept
    // Admin accepts the request — finds the matching user and creates the family link
    [HttpPost("{id}/accept")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AcceptRequest(int id)
    {
        var request = await _context.FamilyAssociationRequests
            .Include(r => r.Requester)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
            return NotFound(new { message = "Requisição não encontrada" });

        if (request.Status == FamilyAssociationRequestStatus.Accepted)
            return BadRequest(new { message = "Esta requisição já foi aceite." });

        // Search for the matching user by NIF + name + birth date
        User? matchedUser = null;

        var normalizedName = request.FamilyMemberName.Trim().ToLower();

        var candidates = _context.Users.Where(u => u.IsActive).AsQueryable();

        // Filter by NIF if provided
        if (!string.IsNullOrWhiteSpace(request.FamilyMemberNif))
        {
            candidates = candidates.Where(u => u.Nif == request.FamilyMemberNif.Trim());
        }

        // Filter by birth date if provided
        if (request.FamilyMemberBirthDate.HasValue)
        {
            var dob = request.FamilyMemberBirthDate.Value.Date;
            candidates = candidates.Where(u => u.BirthDate != null && u.BirthDate.Value.Date == dob);
        }

        // Load candidates and filter by name client-side (insensitive)
        var candidateList = await candidates.ToListAsync();
        matchedUser = candidateList.FirstOrDefault(u =>
            $"{u.FirstName} {u.LastName}".Trim().ToLower() == normalizedName);

        if (matchedUser == null)
        {
            return NotFound(new
            {
                message = $"Nenhum utilizador encontrado com o nome '{request.FamilyMemberName}', NIF '{request.FamilyMemberNif ?? "N/D"}' e data de nascimento '{(request.FamilyMemberBirthDate.HasValue ? request.FamilyMemberBirthDate.Value.ToString("dd/MM/yyyy") : "N/D")}'. Por favor associe manualmente na aba Pessoas."
            });
        }

        // Avoid duplicate links
        var existingLink = await _context.UserFamilyLinks
            .AnyAsync(l =>
                (l.UserId == request.RequesterId && l.LinkedUserId == matchedUser.Id) ||
                (l.UserId == matchedUser.Id && l.LinkedUserId == request.RequesterId));

        if (!existingLink)
        {
            _context.UserFamilyLinks.Add(new UserFamilyLink
            {
                UserId = request.RequesterId,
                LinkedUserId = matchedUser.Id,
                Relationship = "Outro",
                CreatedAt = DateTime.UtcNow
            });
        }

        request.Status = FamilyAssociationRequestStatus.Accepted;
        request.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Requisição aceite. Associação criada entre {request.Requester.FirstName} e {matchedUser.FirstName} {matchedUser.LastName}.",
            linkedUserId = matchedUser.Id,
            linkedUserName = $"{matchedUser.FirstName} {matchedUser.LastName}"
        });
    }

    // POST: api/family-associations/{id}/reject
    // Admin rejects the request
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectRequestDto dto)
    {
        var request = await _context.FamilyAssociationRequests.FindAsync(id);

        if (request == null)
            return NotFound(new { message = "Requisição não encontrada" });

        if (request.Status == FamilyAssociationRequestStatus.Rejected)
            return BadRequest(new { message = "Esta requisição já foi recusada." });

        request.Status = FamilyAssociationRequestStatus.Rejected;
        request.ReviewedAt = DateTime.UtcNow;
        request.AdminNote = dto.AdminNote?.Trim();

        await _context.SaveChangesAsync();

        return Ok(new { message = "Requisição recusada." });
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

public class FamilyAssociationRequestDto
{
    public string FamilyMemberName { get; set; } = string.Empty;
    public string? FamilyMemberNif { get; set; }
    public DateTime? FamilyMemberBirthDate { get; set; }
    public string? RequesterMessage { get; set; }
    public int? UserId { get; set; }
}

public class FamilyRequestResponse
{
    public int Id { get; set; }
    public string FamilyMemberName { get; set; } = string.Empty;
    public string? FamilyMemberNif { get; set; }
    public DateTime? FamilyMemberBirthDate { get; set; }
    public string? RequesterMessage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
}

public class FamilyRequestAdminResponse
{
    public int Id { get; set; }
    public int RequesterId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string FamilyMemberName { get; set; } = string.Empty;
    public string? FamilyMemberNif { get; set; }
    public DateTime? FamilyMemberBirthDate { get; set; }
    public string? RequesterMessage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? SeenAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? AdminNote { get; set; }
}

public class RejectRequestDto
{
    public string? AdminNote { get; set; }
}
