using System.Text.Json.Serialization;
using Backend.Models;

namespace Backend.Dtos;

//input via Post,Put
public class PostDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    [JsonConverter(typeof(PostCategoryJsonConverter))]
    public PostCategory Category { get; set; }

    public Location? Location { get; set; }
    public User UserPosted { get; set; } = new();
}
