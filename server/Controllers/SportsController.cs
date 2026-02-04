using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.Services;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly ILogger<SportsController> _logger;

    public SportsController(
        ApplicationDbContext context,
        IImageService imageService,
        ILogger<SportsController> logger)
    {
        _context = context;
        _imageService = imageService;
        _logger = logger;
    }

    // GET: api/sports - Public endpoint for active sports
    [HttpGet]
    public async Task<ActionResult<List<Sport>>> GetActiveSports()
    {
        try
        {
            var sports = await _context.Sports
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active sports");
            return StatusCode(500, new { message = "Error retrieving sports" });
        }
    }

    // GET: api/sports/all - Admin only
    [HttpGet("all")]
    [Authorize]
    public async Task<ActionResult<List<Sport>>> GetAllSports()
    {
        try
        {

            var sports = await _context.Sports
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sports);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all sports");
            return StatusCode(500, new { message = "Error retrieving sports" });
        }
    }

    // POST: api/sports - Admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Sport>> CreateSport([FromForm] SportRequest request)
    {
        try
        {
            string? imageUrl = null;
            if (request.Image != null)
            {
                imageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "sports", 800, 80);
            }

            var sport = new Sport
            {
                Name = request.Name,
                Description = request.Description,
                ImageUrl = imageUrl,
                IsActive = request.IsActive
            };

            _context.Sports.Add(sport);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActiveSports), new { id = sport.Id }, sport);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sport");
            return StatusCode(500, new { message = "Error creating sport" });
        }
    }

    // PUT: api/sports/{id} - Admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateSport(int id, [FromForm] SportRequest request)
    {
        try
        {


            var sport = await _context.Sports.FindAsync(id);
            if (sport == null)
            {
                return NotFound();
            }

            if (request.Image != null)
            {
                if (!string.IsNullOrEmpty(sport.ImageUrl))
                {
                    _imageService.DeleteImage(sport.ImageUrl);
                }
                sport.ImageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "sports", 800, 80);
            }

            sport.Name = request.Name;
            sport.Description = request.Description;
            sport.IsActive = request.IsActive;
            sport.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(sport);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sport");
            return StatusCode(500, new { message = "Error updating sport" });
        }
    }

    // DELETE: api/sports/{id} - Admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteSport(int id)
    {
        try
        {

            var sport = await _context.Sports.FindAsync(id);
            if (sport == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(sport.ImageUrl))
            {
                _imageService.DeleteImage(sport.ImageUrl);
            }

            _context.Sports.Remove(sport);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting sport");
            return StatusCode(500, new { message = "Error deleting sport" });
        }
    }
}

// Request DTO
public class SportRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IFormFile? Image { get; set; }
    public bool IsActive { get; set; } = true;
}
