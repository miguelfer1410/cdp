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

    // POST: api/family-associations/request
    // Any authenticated user submits a request
    [HttpPost("request")]
    public async Task<IActionResult> SubmitRequest([FromBody] FamilyAssociationRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var requesterId))
            return Unauthorized(new { message = "Utilizador não autenticado" });

        if (string.IsNullOrWhiteSpace(request.FamilyMemberName))
            return BadRequest(new { message = "Nome do familiar é obrigatório" });

        var newRequest = new FamilyAssociationRequest
        {
            RequesterId = requesterId,
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
    public async Task<ActionResult<IEnumerable<FamilyRequestResponse>>> GetMyRequests()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var requesterId))
            return Unauthorized(new { message = "Utilizador não autenticado" });

        var requests = await _context.FamilyAssociationRequests
            .Where(r => r.RequesterId == requesterId)
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
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

public class FamilyAssociationRequestDto
{
    public string FamilyMemberName { get; set; } = string.Empty;
    public string? FamilyMemberNif { get; set; }
    public DateTime? FamilyMemberBirthDate { get; set; }
    public string? RequesterMessage { get; set; }
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
}
