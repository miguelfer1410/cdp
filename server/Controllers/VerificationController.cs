using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VerificationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VerificationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> VerifyMember(int id)
    {
        var user = await _context.Users
            .Include(u => u.MemberProfile)
            .Include(u => u.AthleteProfile)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) 
            return NotFound(new { Status = "NotFound", Message = "Sócio não encontrado no sistema." });

        if (user.MemberProfile == null)
            return BadRequest(new { Status = "NotMember", Message = "Este perfil não tem número de sócio." });

        bool isPendente = user.MemberProfile.MembershipStatus == CdpApi.Models.MembershipStatus.Pending;
        bool isAtivo = user.MemberProfile.MembershipStatus == CdpApi.Models.MembershipStatus.Active;
        bool isInativo = user.MemberProfile.MembershipStatus == CdpApi.Models.MembershipStatus.Inactive;

        if (!isAtivo)
        {
            string motivo = isPendente ? "Estado Pendente" : "Sócio Inativo / Quotas em Atraso";
            return Ok(new { 
                Status = "Invalid", 
                Message = $"Acesso negado: {motivo}", 
                MemberName = $"{user.FirstName} {user.LastName}",
                MemberNumber = user.MemberProfile.MembershipNumber ?? "0"
            });
        }

        // Se estiver ativo, verificar Pagamentos
        // Check if there are any pending payments in the Payments table for this member
        bool hasPendingPayments = await _context.Payments
            .AnyAsync(p => p.MemberProfileId == user.MemberProfile.Id 
                        && p.Status == "Pending");

        if (hasPendingPayments)
        {
            return Ok(new { 
                Status = "Warning", 
                Message = "Sócio Ativo, mas com pagamentos pendentes.",
                MemberName = $"{user.FirstName} {user.LastName}",
                MemberNumber = user.MemberProfile.MembershipNumber ?? "0"
            });
        }

        return Ok(new { 
            Status = "Valid", 
            Message = "Acesso Autorizado. Quotas em dia.",
            MemberName = $"{user.FirstName} {user.LastName}",
            MemberNumber = user.MemberProfile.MembershipNumber ?? "0",
            Sport = user.AthleteProfile?.Escalao
        });
    }
}
