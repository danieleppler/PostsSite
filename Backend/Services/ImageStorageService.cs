namespace Backend.Services;

public class ImageStorageService : IImageStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private readonly string _imagesDir;

    public ImageStorageService(IWebHostEnvironment env)
    {
        _imagesDir = Path.Combine(env.WebRootPath, "images");
        Directory.CreateDirectory(_imagesDir);
    }

    public async Task<string> SaveAsync(IFormFile file)
    {
        if (file.Length == 0)
        {
            throw new ArgumentException("File is empty.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new ArgumentException("File exceeds the 5 MB size limit.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new ArgumentException("Unsupported file type. Allowed types: jpg, jpeg, png, gif, webp.");
        }

        var fileName = $"{Guid.NewGuid()}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(_imagesDir, fileName);

        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream);

        return $"/images/{fileName}";
    }
}
