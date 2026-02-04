using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;

namespace CdpApi.Services;

public class ImageService : IImageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ImageService> _logger;
    private readonly string _uploadsPath;

    public ImageService(IWebHostEnvironment environment, ILogger<ImageService> logger)
    {
        _environment = environment;
        _logger = logger;
        _uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");

        // Create uploads directory if it doesn't exist
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
        }
    }

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        try
        {
            var folderPath = Path.Combine(_uploadsPath, folder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{folder}/{fileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving image");
            throw;
        }
    }

    public async Task<string> OptimizeAndSaveImageAsync(IFormFile file, string folder, int maxWidth = 1920, int quality = 85)
    {
        try
        {
            var folderPath = Path.Combine(_uploadsPath, folder);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            // Generate unique filename with .webp extension for better compression
            var fileName = $"{Guid.NewGuid()}.webp";
            var filePath = Path.Combine(folderPath, fileName);

            using (var image = await Image.LoadAsync(file.OpenReadStream()))
            {
                // Resize if image is larger than maxWidth
                if (image.Width > maxWidth)
                {
                    var ratio = (double)maxWidth / image.Width;
                    var newHeight = (int)(image.Height * ratio);
                    
                    image.Mutate(x => x.Resize(maxWidth, newHeight));
                }

                // Save as WebP with quality setting for optimal compression
                var encoder = new WebpEncoder
                {
                    Quality = quality,
                    FileFormat = WebpFileFormatType.Lossy
                };

                await image.SaveAsync(filePath, encoder);
            }

            _logger.LogInformation($"Image optimized and saved: {fileName} (max width: {maxWidth}, quality: {quality})");
            return $"/uploads/{folder}/{fileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error optimizing and saving image");
            throw;
        }
    }

    public bool DeleteImage(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
                return false;

            var filePath = Path.Combine(_environment.WebRootPath, imageUrl.TrimStart('/'));
            
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation($"Image deleted: {imageUrl}");
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting image: {imageUrl}");
            return false;
        }
    }
}
