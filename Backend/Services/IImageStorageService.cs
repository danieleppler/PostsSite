namespace Backend.Services;

public interface IImageStorageService
{
    Task<string> SaveAsync(IFormFile file);
}
