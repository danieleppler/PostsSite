using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public class PostRepository : IPostRepository
{
    private readonly string _filePath;
    private readonly IIdGenerator _idGenerator;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        WriteIndented = true
    };

    public PostRepository(IWebHostEnvironment env, IIdGenerator idGenerator)
    {
        _idGenerator = idGenerator;
        var dataDir = Path.Combine(env.ContentRootPath, "Data");
        Directory.CreateDirectory(dataDir);
        _filePath = Path.Combine(dataDir, "posts.json");

        if (!File.Exists(_filePath))
        {
            File.WriteAllText(_filePath, "[]");
        }
    }

    public async Task<List<Post>> GetAllAsync()
    {
        await _lock.WaitAsync();
        try
        {
            return await ReadAllAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<List<Post>> GetPagedAsync(int pageNumber, int itemCount)
    {
        var all = await GetAllAsync();
        return all
            .OrderByDescending(p => p.DatePosted)
            .Skip((pageNumber - 1) * itemCount)
            .Take(itemCount)
            .ToList();
    }

    public async Task<Post?> GetByIdAsync(string id)
    {
        var posts = await GetAllAsync();
        return posts.FirstOrDefault(p => p.Id == id);
    }

    public async Task<Post> CreateAsync(Post post)
    {
        await _lock.WaitAsync();
        try
        {
            var posts = await ReadAllAsync();
            post.Id = string.IsNullOrWhiteSpace(post.Id) ? _idGenerator.NewId() ?? string.Empty : post.Id;
            posts.Add(post);
            await WriteAllAsync(posts);
            return post;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<Post?> UpdateAsync(string id, Post updated)
    {
        await _lock.WaitAsync();
        try
        {
            var posts = await ReadAllAsync();
            var index = posts.FindIndex(p => p.Id == id);
            if (index == -1)
            {
                return null;
            }

            updated.Id = id;
            posts[index] = updated;
            await WriteAllAsync(posts);
            return updated;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await _lock.WaitAsync();
        try
        {
            var posts = await ReadAllAsync();
            var removed = posts.RemoveAll(p => p.Id == id) > 0;
            if (removed)
            {
                await WriteAllAsync(posts);
            }
            return removed;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<List<Post>> ReadAllAsync()
    {
        await using var stream = File.OpenRead(_filePath);
        if (stream.Length == 0)
        {
            return new List<Post>();
        }
        var posts = await JsonSerializer.DeserializeAsync<List<Post>>(stream, _serializerOptions);
        return posts ?? new List<Post>();
    }

    private async Task WriteAllAsync(List<Post> posts)
    {
        await using var stream = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(stream, posts, _serializerOptions);
    }
}
