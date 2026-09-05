using System.Text.Json;
using Backend.Models;

namespace Backend.Services;

public class PostRepository : IPostRepository
{
    private const int MaxTitleLength = 200;
    private const int MaxDescriptionLength = 2000;
    private const int MaxPathLength = 500;
    private const int MaxUserFieldLength = 200;

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

    public async Task<PagedResult<Post>> GetPagedAsync(
        int pageNumber,
        int itemCount,
        PostFilter? filter = null,
        UserLocation? sortOrigin = null)
    {
        var all = await GetAllAsync();
        var filtered = ApplyFilter(all, filter).ToList();

        var ordered = sortOrigin is { } origin
            ? filtered.OrderBy(p => DistanceKm(origin, p.Location))
            : filtered.OrderByDescending(p => p.DatePosted);

        var items = ordered
            .Skip((pageNumber - 1) * itemCount)
            .Take(itemCount)
            .ToList();

        return new PagedResult<Post>(items, filtered.Count);
    }

    // Great-circle (Haversine) distance in kilometers. Posts without a
    // location can't be placed on the sort, so they're pushed to the end.
    private static double DistanceKm(UserLocation origin, Location? location)
    {
        if (location is null)
        {
            return double.MaxValue;
        }

        const double earthRadiusKm = 6371.0;
        var lat1 = ToRadians(origin.Latitude);
        var lon1 = ToRadians(origin.Longitude);
        var lat2 = ToRadians((double)location.Latitude);
        var lon2 = ToRadians((double)location.Longitude);

        var dLat = lat2 - lat1;
        var dLon = lon2 - lon1;

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1) * Math.Cos(lat2) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    private static IEnumerable<Post> ApplyFilter(IEnumerable<Post> posts, PostFilter? filter)
    {
        if (filter is null)
        {
            return posts;
        }

        var result = posts;

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            result = result.Where(p => p.Title.Contains(filter.Search, StringComparison.OrdinalIgnoreCase));
        }

        if (filter.Category is { } category)
        {
            result = result.Where(p => p.Category == category);
        }

        if (filter.DateFrom is { } dateFrom)
        {
            result = result.Where(p => p.DatePosted >= dateFrom.Date);
        }

        if (filter.DateTo is { } dateTo)
        {
            result = result.Where(p => p.DatePosted < dateTo.Date.AddDays(1));
        }

        return result;
    }

    public async Task<Post?> GetByIdAsync(string id)
    {
        var posts = await GetAllAsync();
        return posts.FirstOrDefault(p => p.Id == id);
    }

    public async Task<Post> CreateAsync(Post post)
    {
        ValidatePost(post);

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
        ValidatePost(updated);

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

    // Guards the on-disk store against oversized or control-character payloads
    // (e.g. embedded NUL bytes) that a client could otherwise persist directly
    // via the JSON API.
    private static void ValidatePost(Post post)
    {
        ValidateRequired(post.Title, nameof(Post.Title), MaxTitleLength);
        ValidateRequired(post.Description, nameof(Post.Description), MaxDescriptionLength);
        ValidateOptional(post.PostImage, nameof(Post.PostImage), MaxPathLength);
        ValidateRequired(post.UserPosted.Id, "UserPosted.Id", MaxUserFieldLength);
        ValidateRequired(post.UserPosted.Name, "UserPosted.Name", MaxUserFieldLength);
        ValidateOptional(post.UserPosted.Avatar, "UserPosted.Avatar", MaxPathLength);

        if (post.Location is { } location &&
            (location.Latitude < -90 || location.Latitude > 90 ||
             location.Longitude < -180 || location.Longitude > 180))
        {
            throw new ArgumentException("Location coordinates are out of range.");
        }
    }

    private static void ValidateRequired(string value, string fieldName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{fieldName} is required.");
        }
        ValidateContent(value, fieldName, maxLength);
    }

    private static void ValidateOptional(string value, string fieldName, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
        {
            return;
        }
        ValidateContent(value, fieldName, maxLength);
    }

    private static void ValidateContent(string value, string fieldName, int maxLength)
    {
        if (value.Length > maxLength)
        {
            throw new ArgumentException($"{fieldName} must be at most {maxLength} characters.");
        }

        foreach (var c in value)
        {
            if (char.IsControl(c) && c is not ('\t' or '\n' or '\r'))
            {
                throw new ArgumentException($"{fieldName} contains invalid control characters.");
            }
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
