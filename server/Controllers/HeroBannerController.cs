using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.Services;
using System.Security.Claims;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HeroBannerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly ILogger<HeroBannerController> _logger;

    public HeroBannerController(
        ApplicationDbContext context,
        IImageService imageService,
        ILogger<HeroBannerController> logger)
    {
        _context = context;
        _imageService = imageService;
        _logger = logger;
    }

    // GET: api/herobanner - Public endpoint for active banners
    [HttpGet]
    public async Task<ActionResult<List<HeroBanner>>> GetActiveBanners()
    {
        try
        {
            var banners = await _context.HeroBanners
                .Where(b => b.IsActive)
                .OrderBy(b => b.Order)
                .ToListAsync();

            return Ok(banners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active banners");
            return StatusCode(500, new { message = "Error retrieving banners" });
        }
    }

    // GET: api/herobanner/all - Admin only
    [HttpGet("all")]
    [Authorize]
    public async Task<ActionResult<List<HeroBanner>>> GetAllBanners()
    {
        try
        {

            var banners = await _context.HeroBanners
                .OrderBy(b => b.Order)
                .ToListAsync();

            return Ok(banners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all banners");
            return StatusCode(500, new { message = "Error retrieving banners" });
        }
    }

    // POST: api/herobanner - Admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<HeroBanner>> CreateBanner([FromForm] HeroBannerRequest request)
    {
        try
        {
            string imageUrl = "";
            if (request.Image != null)
            {
                // Optimize image: resize to max 1920px width, 85% quality, convert to WebP
                imageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "hero", 1920, 85);
            }

            var banner = new HeroBanner
            {
                ImageUrl = imageUrl,
                Title = request.Title,
                Subtitle = request.Subtitle,
                ButtonText = request.ButtonText,
                ButtonLink = request.ButtonLink,
                Order = request.Order,
                IsActive = request.IsActive
            };

            _context.HeroBanners.Add(banner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActiveBanners), new { id = banner.Id }, banner);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating banner");
            return StatusCode(500, new { message = "Error creating banner" });
        }
    }

    // PUT: api/herobanner/{id} - Admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateBanner(int id, [FromForm] HeroBannerRequest request)
    {
        try
        {

            var banner = await _context.HeroBanners.FindAsync(id);
            if (banner == null)
            {
                return NotFound();
            }

            // Update image if new one provided
            if (request.Image != null)
            {
                // Delete old image
                _imageService.DeleteImage(banner.ImageUrl);
                
                // Save optimized new image
                banner.ImageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "hero", 1920, 85);
            }

            banner.Title = request.Title;
            banner.Subtitle = request.Subtitle;
            banner.ButtonText = request.ButtonText;
            banner.ButtonLink = request.ButtonLink;
            banner.Order = request.Order;
            banner.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(banner);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating banner");
            return StatusCode(500, new { message = "Error updating banner" });
        }
    }

    // DELETE: api/herobanner/{id} - Admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteBanner(int id)
    {
        try
        {

            var banner = await _context.HeroBanners.FindAsync(id);
            if (banner == null)
            {
                return NotFound();
            }

            // Delete image file
            _imageService.DeleteImage(banner.ImageUrl);

            _context.HeroBanners.Remove(banner);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting banner");
            return StatusCode(500, new { message = "Error deleting banner" });
        }
    }
}

// Request DTO
public class HeroBannerRequest
{
    public IFormFile? Image { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? ButtonText { get; set; }
    public string? ButtonLink { get; set; }
    public int Order { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
