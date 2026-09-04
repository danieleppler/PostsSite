using System.Text.Json.Serialization;
using Backend.Models;

namespace Backend.Dtos;

//outpust via PUT,POST
public class PostResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PostImage { get; set; } = string.Empty;

    [JsonConverter(typeof(PostCategoryJsonConverter))]
    public PostCategory Category { get; set; }

    public Location? Location { get; set; }
    public DateTime DatePosted { get; set; }
    public User UserPosted { get; set; } = new();
}
