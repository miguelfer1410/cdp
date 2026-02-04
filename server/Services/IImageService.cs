namespace CdpApi.Services;

public interface IImageService
{
    Task<string> SaveImageAsync(IFormFile file, string folder);
    bool DeleteImage(string imageUrl);
    Task<string> OptimizeAndSaveImageAsync(IFormFile file, string folder, int maxWidth = 1920, int quality = 85);
}
