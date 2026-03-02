using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EscalaosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EscalaosController> _logger;

    public EscalaosController(ApplicationDbContext context, ILogger<EscalaosController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/escalaos — public, active only
    [HttpGet]
    public async Task<ActionResult<List<EscalaoDto>>> GetActiveEscalaos()
    {
        try
        {
            var list = await _context.Escalaos
                .Where(e => e.IsActive)
                .OrderBy(e => e.Name)
                .Select(e => new EscalaoDto { Id = e.Id, Name = e.Name, IsActive = e.IsActive })
                .ToListAsync();

            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting escalaos");
            return StatusCode(500, new { message = "Erro ao obter escalões" });
        }
    }

    // GET: api/escalaos/all — admin only
    [HttpGet("all")]
    [Authorize]
    public async Task<ActionResult<List<EscalaoDto>>> GetAllEscalaos()
    {
        try
        {
            var list = await _context.Escalaos
                .OrderBy(e => e.Name)
                .Select(e => new EscalaoDto { Id = e.Id, Name = e.Name, IsActive = e.IsActive })
                .ToListAsync();

            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all escalaos");
            return StatusCode(500, new { message = "Erro ao obter escalões" });
        }
    }

    // POST: api/escalaos — admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<EscalaoDto>> CreateEscalao([FromBody] EscalaoUpsertRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "O nome do escalão é obrigatório" });

            var exists = await _context.Escalaos.AnyAsync(e => e.Name == request.Name.Trim());
            if (exists)
                return Conflict(new { message = "Já existe um escalão com esse nome" });

            var escalao = new Escalao
            {
                Name = request.Name.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Escalaos.Add(escalao);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllEscalaos), new { },
                new EscalaoDto { Id = escalao.Id, Name = escalao.Name, IsActive = escalao.IsActive });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating escalao");
            return StatusCode(500, new { message = "Erro ao criar escalão" });
        }
    }

    // PUT: api/escalaos/{id} — admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateEscalao(int id, [FromBody] EscalaoUpsertRequest request)
    {
        try
        {
            var escalao = await _context.Escalaos.FindAsync(id);
            if (escalao == null)
                return NotFound(new { message = "Escalão não encontrado" });

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "O nome do escalão é obrigatório" });

            var nameConflict = await _context.Escalaos
                .AnyAsync(e => e.Name == request.Name.Trim() && e.Id != id);
            if (nameConflict)
                return Conflict(new { message = "Já existe um escalão com esse nome" });

            escalao.Name = request.Name.Trim();
            await _context.SaveChangesAsync();

            return Ok(new EscalaoDto { Id = escalao.Id, Name = escalao.Name, IsActive = escalao.IsActive });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating escalao {Id}", id);
            return StatusCode(500, new { message = "Erro ao atualizar escalão" });
        }
    }

    // DELETE: api/escalaos/{id} — admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteEscalao(int id)
    {
        try
        {
            var escalao = await _context.Escalaos.FindAsync(id);
            if (escalao == null)
                return NotFound(new { message = "Escalão não encontrado" });

            // Check if any team is using this escalao
            var inUse = await _context.Teams.AnyAsync(t => t.EscalaoId == id);
            if (inUse)
                return BadRequest(new { message = "Não é possível eliminar um escalão que está a ser utilizado por uma equipa" });

            _context.Escalaos.Remove(escalao);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting escalao {Id}", id);
            return StatusCode(500, new { message = "Erro ao eliminar escalão" });
        }
    }
}

// DTOs
public class EscalaoDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class EscalaoUpsertRequest
{
    public string Name { get; set; } = string.Empty;
}
