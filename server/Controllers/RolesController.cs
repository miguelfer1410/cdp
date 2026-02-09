using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RolesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/roles - Get all roles
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RoleResponse>>> GetRoles()
    {
        var roles = await _context.Roles
            .OrderBy(r => r.Name)
            .ToListAsync();

        var response = roles.Select(r => new RoleResponse
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description
        }).ToList();

        return Ok(response);
    }
}

public class RoleResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
