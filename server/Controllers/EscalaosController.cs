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
                .Select(e => new EscalaoDto 
                { 
                    Id = e.Id, 
                    Name = e.Name, 
                    IsActive = e.IsActive,
                    MinAge = e.MinAge,
                    MaxAge = e.MaxAge,
                    SportIds = e.EscalaoSports.Select(es => es.SportId).ToList()
                })
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
                .Select(e => new EscalaoDto 
                { 
                    Id = e.Id, 
                    Name = e.Name, 
                    IsActive = e.IsActive,
                    MinAge = e.MinAge,
                    MaxAge = e.MaxAge,
                    SportIds = e.EscalaoSports.Select(es => es.SportId).ToList()
                })
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
                MinAge = request.MinAge,
                MaxAge = request.MaxAge,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Escalaos.Add(escalao);
            await _context.SaveChangesAsync();

            if (request.SportIds != null && request.SportIds.Any())
            {
                foreach (var sportId in request.SportIds)
                {
                    _context.EscalaoSports.Add(new EscalaoSport { EscalaoId = escalao.Id, SportId = sportId });
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetAllEscalaos), new { },
                new EscalaoDto 
                { 
                    Id = escalao.Id, 
                    Name = escalao.Name, 
                    IsActive = escalao.IsActive,
                    MinAge = escalao.MinAge,
                    MaxAge = escalao.MaxAge,
                    SportIds = request.SportIds ?? new()
                });
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
            escalao.MinAge = request.MinAge;
            escalao.MaxAge = request.MaxAge;

            // Update sports
            var currentSports = await _context.EscalaoSports.Where(es => es.EscalaoId == id).ToListAsync();
            _context.EscalaoSports.RemoveRange(currentSports);

            if (request.SportIds != null && request.SportIds.Any())
            {
                foreach (var sportId in request.SportIds)
                {
                    _context.EscalaoSports.Add(new EscalaoSport { EscalaoId = id, SportId = sportId });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new EscalaoDto 
            { 
                Id = escalao.Id, 
                Name = escalao.Name, 
                IsActive = escalao.IsActive,
                MinAge = escalao.MinAge,
                MaxAge = escalao.MaxAge,
                SportIds = request.SportIds ?? new()
            });
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
    // POST: api/escalaos/preview-promotion — admin only
    [HttpPost("preview-promotion")]
    [Authorize]
    public async Task<ActionResult<List<PromotionPreviewDto>>> PreviewPromotion()
    {
        try
        {
            var athletes = await _context.AthleteProfiles
                .Include(a => a.User)
                .Include(a => a.AthleteTeams.Where(at => at.LeftAt == null))
                    .ThenInclude(at => at.Team)
                        .ThenInclude(t => t.Sport)
                .Where(a => a.User.IsActive && a.User.BirthDate != null)
                .ToListAsync();

            var allTeams = await _context.Teams
                .Where(t => t.IsActive)
                .ToListAsync();

            var escalaos = await _context.Escalaos
                .Where(e => e.IsActive && (e.MinAge != null || e.MaxAge != null))
                .Include(e => e.EscalaoSports)
                .ToListAsync();

            var preview = new List<PromotionPreviewDto>();
            var now = DateTime.UtcNow;

            foreach (var athlete in athletes)
            {
                var age = now.Year - athlete.User.BirthDate!.Value.Year;
                if (athlete.User.BirthDate.Value.Date > now.AddYears(-age).Date) age--;

                foreach (var at in athlete.AthleteTeams)
                {
                    var currentTeam = at.Team;
                    
                    // 1. Verificar se o escalão atual da equipa já é válido para a idade r modalidade
                    var currentEscalao = escalaos.FirstOrDefault(e => e.Id == currentTeam.EscalaoId);
                    bool currentStillValid = currentEscalao != null && 
                        currentEscalao.EscalaoSports.Any(es => es.SportId == currentTeam.SportId) &&
                        (currentEscalao.MinAge == null || age >= currentEscalao.MinAge) &&
                        (currentEscalao.MaxAge == null || age <= currentEscalao.MaxAge);

                    // Se o escalão atual for válido, não sugerimos mudança (evita ajustes redundantes)
                    if (currentStillValid) continue;

                    // 2. Procura o escalão "ideal" se o atual não for válido
                    var correctEscalao = escalaos.FirstOrDefault(e => 
                        e.EscalaoSports.Any(es => es.SportId == currentTeam.SportId) &&
                        (e.MinAge == null || age >= e.MinAge) &&
                        (e.MaxAge == null || age <= e.MaxAge));

                    // Se encontrarmos um escalão correto (que por definição será diferente do atual, pois o atual falhou a validação acima)
                    if (correctEscalao != null)
                    {
                        // Determinar o género efetivo do atleta:
                        // Prioridade 1: Género definido no utilizador (se não for Misto)
                        // Prioridade 2: Género da equipa atual (se o do utilizador for Misto ou não definido)
                        var effectiveGender = athlete.User.Gender;
                        if (effectiveGender == Gender.Mixed || (int)effectiveGender == 0)
                        {
                            effectiveGender = currentTeam.Gender;
                        }

                        // Procurar uma equipa de destino para esta modalidade, este escalão e género compatível.
                        // Usamos todos os escalões que cobrem a mesma faixa etária alvo (ex: Sub 16, Sub 16 A, Sub 16 B)
                        // para garantir que encontramos o time correto mesmo que o time esteja associado a um sub-escalão.
                        var validTargetEscalaoIds = escalaos
                            .Where(e => 
                                e.EscalaoSports.Any(es => es.SportId == currentTeam.SportId) &&
                                (e.MinAge == null || age >= e.MinAge) &&
                                (e.MaxAge == null || age <= e.MaxAge))
                            .Select(e => e.Id)
                            .ToHashSet();

                        var targetTeam = allTeams.FirstOrDefault(t => 
                            t.SportId == currentTeam.SportId && 
                            t.EscalaoId.HasValue && validTargetEscalaoIds.Contains(t.EscalaoId.Value) &&
                            t.EscalaoId != currentTeam.EscalaoId &&
                            (t.Gender == effectiveGender || t.Gender == Gender.Mixed));

                        // Determinar tipo de movimento
                        var movementType = "Promotion"; // Default to promotion if we can't determine
                        if (currentEscalao != null)
                        {
                            if (currentEscalao.MaxAge.HasValue && age > currentEscalao.MaxAge.Value)
                                movementType = "Promotion";
                            else if (currentEscalao.MinAge.HasValue && age < currentEscalao.MinAge.Value)
                                movementType = "Relegation";
                            else
                                movementType = "Adjustment";
                        }

                        preview.Add(new PromotionPreviewDto
                        {
                            AthleteId = athlete.Id,
                            AthleteName = string.IsNullOrWhiteSpace(athlete.FirstName) 
                                ? $"{athlete.User.FirstName} {athlete.User.LastName}".Trim() 
                                : $"{athlete.FirstName} {athlete.LastName}".Trim(),
                            BirthDate = athlete.User.BirthDate.Value,
                            Age = age,
                            CurrentTeamId = currentTeam.Id,
                            CurrentTeamName = currentTeam.Name,
                            SportName = currentTeam.Sport.Name,
                            CurrentEscalaoName = currentEscalao?.Name ?? "Sem Escalão",
                            NewEscalaoName = correctEscalao.Name,
                            TargetMinAge = correctEscalao.MinAge,
                            TargetMaxAge = correctEscalao.MaxAge,
                            TargetTeamId = targetTeam?.Id,
                            TargetTeamName = targetTeam?.Name ?? "Nenhuma equipa compatível encontrada",
                            MovementType = movementType
                        });
                    }
                }
            }

            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing promotion");
            return StatusCode(500, new { message = "Erro ao pré-visualizar promoções" });
        }
    }

    // POST: api/escalaos/promote — admin only
    [HttpPost("promote")]
    [Authorize]
    public async Task<IActionResult> PromoteAtletes([FromBody] List<PromotionItemRequest> requests)
    {
        if (requests == null || !requests.Any())
            return BadRequest(new { message = "Nenhuma promoção selecionada" });

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            int count = 0;
            var now = DateTime.UtcNow;

            foreach (var item in requests)
            {
                // 1. Terminar a ligação à equipa atual
                var currentAssociation = await _context.AthleteTeams
                    .FirstOrDefaultAsync(at => at.AthleteProfileId == item.AthleteId && at.TeamId == item.CurrentTeamId && at.LeftAt == null);

                if (currentAssociation != null)
                {
                    currentAssociation.LeftAt = now;

                    // 2. Criar nova ligação na equipa de destino
                    var newAssociation = new AthleteTeam
                    {
                        AthleteProfileId = item.AthleteId,
                        TeamId = item.TargetTeamId,
                        JerseyNumber = currentAssociation.JerseyNumber,
                        Position = currentAssociation.Position,
                        LicenseNumber = currentAssociation.LicenseNumber,
                        JoinedAt = now,
                        InscriptionPaid = currentAssociation.InscriptionPaid,
                        InscriptionPaidDate = currentAssociation.InscriptionPaidDate
                    };

                    _context.AthleteTeams.Add(newAssociation);
                    count++;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Promoção concluída com sucesso", promotedCount = count });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error promoting athletes");
            return StatusCode(500, new { message = "Erro ao executar promoção" });
        }
    }
}

// DTOs
public class PromotionItemRequest
{
    public int AthleteId { get; set; }
    public int CurrentTeamId { get; set; }
    public int TargetTeamId { get; set; }
}
public class PromotionPreviewDto
{
    public int AthleteId { get; set; }
    public string AthleteName { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public int Age { get; set; }
    public int CurrentTeamId { get; set; }
    public string CurrentTeamName { get; set; } = string.Empty;
    public string SportName { get; set; } = string.Empty;
    public string CurrentEscalaoName { get; set; } = string.Empty;
    public string NewEscalaoName { get; set; } = string.Empty;
    public int? TargetMinAge { get; set; }
    public int? TargetMaxAge { get; set; }
    public int? TargetTeamId { get; set; }
    public string TargetTeamName { get; set; } = string.Empty;
    public string MovementType { get; set; } = string.Empty; // "Promotion" or "Relegation"
}
public class EscalaoDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public List<int> SportIds { get; set; } = new();
    public bool IsActive { get; set; }
}

public class EscalaoUpsertRequest
{
    public string Name { get; set; } = string.Empty;
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public List<int> SportIds { get; set; } = new();
}
