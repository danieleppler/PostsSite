using Backend.Models;

namespace Backend.Services;

public interface IPostRepository
{
    Task<List<Post>> GetAllAsync();
    Task<List<Post>> GetPagedAsync(int pageNumber, int itemCount);
    Task<Post?> GetByIdAsync(string id);
    Task<Post> CreateAsync(Post post);
    Task<Post?> UpdateAsync(string id, Post updated);
    Task<bool> DeleteAsync(string id);
}
