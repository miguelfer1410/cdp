using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.Services;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly ILogger<NewsController> _logger;

    public NewsController(
        ApplicationDbContext context,
        IImageService imageService,
        ILogger<NewsController> logger)
    {
        _context = context;
        _imageService = imageService;
        _logger = logger;
    }

    // GET: api/news - Public endpoint for published news
    [HttpGet]
    public async Task<ActionResult<List<NewsArticle>>> GetPublishedNews([FromQuery] string? category = null)
    {
        try
        {
            var query = _context.NewsArticles
                .Include(n => n.Author)
                .Where(n => n.IsPublished);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(n => n.Category == category);
            }

            var news = await query
                .OrderByDescending(n => n.PublishedAt)
                .ToListAsync();

            return Ok(news);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting published news");
            return StatusCode(500, new { message = "Error retrieving news" });
        }
    }

    // GET: api/news/{slug} - Public endpoint for single article
    [HttpGet("{slug}")]
    public async Task<ActionResult<NewsArticle>> GetNewsBySlug(string slug)
    {
        try
        {
            var article = await _context.NewsArticles
                .Include(n => n.Author)
                .FirstOrDefaultAsync(n => n.Slug == slug && n.IsPublished);

            if (article == null)
            {
                return NotFound();
            }

            return Ok(article);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting news by slug: {slug}");
            return StatusCode(500, new { message = "Error retrieving article" });
        }
    }

    // GET: api/news/admin/all - Admin only
    [HttpGet("admin/all")]
    [Authorize]
    public async Task<ActionResult<List<NewsArticle>>> GetAllNews()
    {
        try
        {

            var news = await _context.NewsArticles
                .Include(n => n.Author)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(news);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all news");
            return StatusCode(500, new { message = "Error retrieving news" });
        }
    }

    // POST: api/news - Admin only
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<NewsArticle>> CreateNews([FromForm] NewsRequest request)
    {
        try
        {

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int authorId))
            {
                return Unauthorized();
            }

            string? imageUrl = null;
            if (request.Image != null)
            {
                // Optimize news images: max 1200px width, 80% quality
                imageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "news", 1200, 80);
            }

            var slug = GenerateSlug(request.Title);
            
            // Ensure slug is unique
            var existingSlug = await _context.NewsArticles.AnyAsync(n => n.Slug == slug);
            if (existingSlug)
            {
                slug = $"{slug}-{Guid.NewGuid().ToString().Substring(0, 8)}";
            }

            var article = new NewsArticle
            {
                Title = request.Title,
                Slug = slug,
                Excerpt = request.Excerpt,
                Content = request.Content,
                ImageUrl = imageUrl,
                Category = request.Category,
                AuthorId = authorId,
                IsPublished = request.IsPublished,
                PublishedAt = request.IsPublished ? DateTime.UtcNow : null
            };

            _context.NewsArticles.Add(article);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNewsBySlug), new { slug = article.Slug }, article);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating news");
            return StatusCode(500, new { message = "Error creating article" });
        }
    }

    // PUT: api/news/{id} - Admin only
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateNews(int id, [FromForm] NewsRequest request)
    {
        try
        {

            var article = await _context.NewsArticles.FindAsync(id);
            if (article == null)
            {
                return NotFound();
            }

            // Update image if new one provided
            if (request.Image != null)
            {
                if (!string.IsNullOrEmpty(article.ImageUrl))
                {
                    _imageService.DeleteImage(article.ImageUrl);
                }
                article.ImageUrl = await _imageService.OptimizeAndSaveImageAsync(request.Image, "news", 1200, 80);
            }

            article.Title = request.Title;
            article.Excerpt = request.Excerpt;
            article.Content = request.Content;
            article.Category = request.Category;
            article.IsPublished = request.IsPublished;
            article.UpdatedAt = DateTime.UtcNow;

            if (request.IsPublished && !article.PublishedAt.HasValue)
            {
                article.PublishedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(article);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating news");
            return StatusCode(500, new { message = "Error updating article" });
        }
    }

    // DELETE: api/news/{id} - Admin only
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteNews(int id)
    {
        try
        {

            var article = await _context.NewsArticles.FindAsync(id);
            if (article == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(article.ImageUrl))
            {
                _imageService.DeleteImage(article.ImageUrl);
            }

            _context.NewsArticles.Remove(article);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting news");
            return StatusCode(500, new { message = "Error deleting article" });
        }
    }

    private string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[àáâãäå]", "a");
        slug = Regex.Replace(slug, @"[èéêë]", "e");
        slug = Regex.Replace(slug, @"[ìíîï]", "i");
        slug = Regex.Replace(slug, @"[òóôõö]", "o");
        slug = Regex.Replace(slug, @"[ùúûü]", "u");
        slug = Regex.Replace(slug, @"[ç]", "c");
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}

// Request DTO
public class NewsRequest
{
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public IFormFile? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
}
