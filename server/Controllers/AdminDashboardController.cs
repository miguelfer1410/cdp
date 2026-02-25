using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminDashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var pendingFamilyRequests = await _context.FamilyAssociationRequests
            .CountAsync(r => r.Status == FamilyAssociationRequestStatus.Pending);

        var pendingEscalaoRequests = await _context.EscalaoRequests
            .CountAsync(r => r.Status == EscalaoRequestStatus.Pending);

        return Ok(new
        {
            totalPendingRequests = pendingFamilyRequests + pendingEscalaoRequests,
            familyPending = pendingFamilyRequests,
            escalaoPending = pendingEscalaoRequests
        });
    }
}
