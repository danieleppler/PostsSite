using Backend.Dtos;
using Backend.Models;
using Backend.Services;

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

posts.MapGet("/", async ([AsParameters] PostQueryDto query, IPostRepository repository) =>
{
    var pageNumber = query.PageNumber is null or < 1 ? 1 : query.PageNumber.Value;
    var itemCount = query.ItemCount is null or < 1 ? 12 : query.ItemCount.Value;

    var paged = await repository.GetPagedAsync(pageNumber, itemCount);

    return Results.Ok(new PagedPostResponseDto
    {
        PageNumber = pageNumber,
        ItemCount = itemCount,
        Items = paged.Select(p => p.ToResponseDto()).ToList()
    });
});

posts.MapGet("/{id}", async (string id, IPostRepository repository) =>
{
    var post = await repository.GetByIdAsync(id);
    return post is not null ? Results.Ok(post.ToResponseDto()) : Results.NotFound();
});

posts.MapPost("/", async (PostDto dto, IPostRepository repository) =>
{
    var post = dto.ToPost();
    post.DatePosted = DateTime.UtcNow;

    var created = await repository.CreateAsync(post);
    return Results.Created($"/api/posts/{created.Id}", created.ToResponseDto());
});

posts.MapPut("/{id}", async (string id, PostDto dto, IPostRepository repository) =>
{
    var existing = await repository.GetByIdAsync(id);
    if (existing is null)
    {
        return Results.NotFound();
    }

    var updated = dto.ToPost();
    updated.PostImage = existing.PostImage;
    updated.DatePosted = existing.DatePosted;

    var result = await repository.UpdateAsync(id, updated);
    return result is not null ? Results.Ok(result.ToResponseDto()) : Results.NotFound();
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
