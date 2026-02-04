using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.Services;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartnersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly ILogger<PartnersController> _logger;

    public PartnersController(
        ApplicationDbContext context,
        IImageService imageService,
        ILogger<PartnersController> logger)
    {
        _context = context;
        _imageService = imageService;
        _logger = logger;
    }

    // GET: api/partners - Public endpoint for active partners
    [HttpGet]
    public async Task<ActionResult<List<InstitutionalPartner>>> GetActivePartners()
    {
        try
        {
            var partners = await _context.InstitutionalPartners
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(partners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active partners");
            return StatusCode(500, new { message = "Error retrieving partners" });
        }
    }

    // GET: api/partners/all - Admin only
    [HttpGet("all")]
    [Authorize]
    public async Task<ActionResult<List<InstitutionalPartner>>> GetAllPartners()
    {
        try
        {
            var partners = await _context.InstitutionalPartners
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(partners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all partners");
            return StatusCode(500, new { message = "Error retrieving partners" });
        }
    }

    // POST: api/partners - Admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<InstitutionalPartner>> CreatePartner([FromForm] PartnerRequest request)
    {
        try
        {

            string logoUrl = "";
            if (request.Logo != null)
            {
                // Optimize logos: smaller size, higher quality for crisp logos
                logoUrl = await _imageService.OptimizeAndSaveImageAsync(request.Logo, "partners", 400, 90);
            }

            var partner = new InstitutionalPartner
            {
                Name = request.Name,
                LogoUrl = logoUrl,
                WebsiteUrl = request.WebsiteUrl,
                IsActive = request.IsActive
            };

            _context.InstitutionalPartners.Add(partner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActivePartners), new { id = partner.Id }, partner);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating partner");
            return StatusCode(500, new { message = "Error creating partner" });
        }
    }

    // PUT: api/partners/{id} - Admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdatePartner(int id, [FromForm] PartnerRequest request)
    {
        try
        {

            var partner = await _context.InstitutionalPartners.FindAsync(id);
            if (partner == null)
            {
                return NotFound();
            }

            if (request.Logo != null)
            {
                _imageService.DeleteImage(partner.LogoUrl);
                partner.LogoUrl = await _imageService.OptimizeAndSaveImageAsync(request.Logo, "partners", 400, 90);
            }

            partner.Name = request.Name;
            partner.WebsiteUrl = request.WebsiteUrl;
            partner.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(partner);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating partner");
            return StatusCode(500, new { message = "Error updating partner" });
        }
    }

    // DELETE: api/partners/{id} - Admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeletePartner(int id)
    {
        try
        {

            var partner = await _context.InstitutionalPartners.FindAsync(id);
            if (partner == null)
            {
                return NotFound();
            }

            _imageService.DeleteImage(partner.LogoUrl);

            _context.InstitutionalPartners.Remove(partner);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting partner");
            return StatusCode(500, new { message = "Error deleting partner" });
        }
    }
}

// Request DTO
public class PartnerRequest
{
    public string Name { get; set; } = string.Empty;
    public IFormFile? Logo { get; set; }
    public string? WebsiteUrl { get; set; }
    public bool IsActive { get; set; } = true;
}
