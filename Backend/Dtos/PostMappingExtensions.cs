using Backend.Models;

namespace Backend.Dtos;

public static class PostMappingExtensions
{
    public static PostResponseDto ToResponseDto(this Post post) => new()
    {
        Id = post.Id,
        Title = post.Title,
        Description = post.Description,
        PostImage = post.PostImage,
        Category = post.Category,
        Location = post.Location,
        DatePosted = post.DatePosted,
        UserPosted = post.UserPosted
    };

    public static Post ToPost(this PostDto dto) => new()
    {
        Title = dto.Title,
        Description = dto.Description,
        PostImage = dto.PostImage,
        Category = dto.Category,
        Location = dto.Location,
        UserPosted = dto.UserPosted
    };
}
