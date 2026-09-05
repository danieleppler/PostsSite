using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new PostCategoryJsonConverter());
    options.SerializerOptions.WriteIndented = true;
});

builder.Services.AddSingleton<IIdGenerator, GuidIdGenerator>();
builder.Services.AddSingleton<IPostRepository, PostRepository>();
builder.Services.AddSingleton<IImageStorageService, ImageStorageService>();

const string FrontendCorsPolicy = "FrontendCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors(FrontendCorsPolicy);
app.UseStaticFiles();

var posts = app.MapGroup("/api/posts");

posts.MapGet("/", async (
    [AsParameters] PostQueryDto query,
    [FromHeader(Name = "X-User-Latitude")] double? userLatitude,
    [FromHeader(Name = "X-User-Longitude")] double? userLongitude,
    IPostRepository repository) =>
{
    var pageNumber = query.PageNumber is null or < 1 ? 1 : query.PageNumber.Value;
    var itemCount = query.ItemCount is null or < 1 ? 12 : query.ItemCount.Value;

    PostCategory? category = null;
    if (!string.IsNullOrWhiteSpace(query.Category))
    {
        if (!PostCategoryValues.TryParse(query.Category, out var parsedCategory))
        {
            return Results.BadRequest($"Unknown category value: {query.Category}");
        }
        category = parsedCategory;
    }

    UserLocation? sortOrigin = null;
    if (string.Equals(query.SortBy, "distance", StringComparison.OrdinalIgnoreCase))
    {
        if (userLatitude is null || userLongitude is null)
        {
            return Results.BadRequest(
                "Sorting by distance requires the X-User-Latitude and X-User-Longitude headers.");
        }
        sortOrigin = new UserLocation(userLatitude.Value, userLongitude.Value);
    }

    var filter = new PostFilter(query.Q, category, query.DateFrom, query.DateTo);
    var paged = await repository.GetPagedAsync(pageNumber, itemCount, filter, sortOrigin);

    return Results.Ok(new PagedPostResponseDto
    {
        PageNumber = pageNumber,
        ItemCount = itemCount,
        TotalCount = paged.TotalCount,
        TotalPages = (int)Math.Ceiling(paged.TotalCount / (double)itemCount),
        Items = paged.Items.Select(p => p.ToResponseDto()).ToList()
    });
});

posts.MapGet("/{id}", async (string id, IPostRepository repository) =>
{
    var post = await repository.GetByIdAsync(id);
    return post is not null ? Results.Ok(post.ToResponseDto()) : Results.NotFound();
});

posts.MapPost("/", async (PostDto dto, IPostRepository repository) =>
{
    try
    {
        var post = dto.ToPost();
        post.DatePosted = DateTime.UtcNow;

        var created = await repository.CreateAsync(post);
        return Results.Created($"/api/posts/{created.Id}", created.ToResponseDto());
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }
});

posts.MapPut("/{id}", async (string id, PostDto dto, IPostRepository repository) =>
{
    var existing = await repository.GetByIdAsync(id);
    if (existing is null)
    {
        return Results.NotFound();
    }

    try
    {
        var updated = dto.ToPost();
        updated.DatePosted = existing.DatePosted;

        var result = await repository.UpdateAsync(id, updated);
        return result is not null ? Results.Ok(result.ToResponseDto()) : Results.NotFound();
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }
});

posts.MapDelete("/{id}", async (string id, IPostRepository repository) =>
{
    var deleted = await repository.DeleteAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound();
});

var images = app.MapGroup("/api/images");

images.MapPost("/upload", async (IFormFile image, IImageStorageService imageStorage) =>
{
    try
    {
        var url = await imageStorage.SaveAsync(image);
        return Results.Ok(new { url });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }
})
.DisableAntiforgery();

app.Run();
