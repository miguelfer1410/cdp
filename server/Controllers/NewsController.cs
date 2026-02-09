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
                .Include(n => n.GalleryImages)
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
                .Include(n => n.GalleryImages)
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

            // Save gallery images if provided
            _logger.LogInformation($"Gallery images count: {request.GalleryImages?.Count ?? 0}");
            
            if (request.GalleryImages != null && request.GalleryImages.Count > 0)
            {
                for (int i = 0; i < request.GalleryImages.Count; i++)
                {
                    _logger.LogInformation($"Processing gallery image {i + 1}/{request.GalleryImages.Count}: {request.GalleryImages[i].FileName}");
                    var galleryImageUrl = await _imageService.OptimizeAndSaveImageAsync(request.GalleryImages[i], "news/gallery", 1200, 80);
                    var newsImage = new NewsImage
                    {
                        NewsArticleId = article.Id,
                        ImageUrl = galleryImageUrl,
                        Order = i
                    };
                    _context.NewsImages.Add(newsImage);
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Successfully saved {request.GalleryImages.Count} gallery images");
            }

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
            // Add new gallery images if provided
            if (request.GalleryImages != null && request.GalleryImages.Count > 0)
            {
                _logger.LogInformation($"Updating article {id}: Processing {request.GalleryImages.Count} new gallery images");

                // Get current max order to append new images
                var currentMaxOrder = await _context.NewsImages
                    .Where(ni => ni.NewsArticleId == id)
                    .MaxAsync(ni => (int?)ni.Order) ?? -1;
                
                _logger.LogInformation($"Current max order for article {id} is {currentMaxOrder}");

                for (int i = 0; i < request.GalleryImages.Count; i++)
                {
                    _logger.LogInformation($"Processing new gallery image {i + 1}/{request.GalleryImages.Count}");
                    var galleryImageUrl = await _imageService.OptimizeAndSaveImageAsync(request.GalleryImages[i], "news/gallery", 1200, 80);
                    
                    var newsImage = new NewsImage
                    {
                        NewsArticleId = id,
                        ImageUrl = galleryImageUrl,
                        Order = currentMaxOrder + 1 + i
                    };
                    _context.NewsImages.Add(newsImage);
                }
                _logger.LogInformation($"Successfully added {request.GalleryImages.Count} new gallery images to context");
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
    public List<IFormFile>? GalleryImages { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
}
