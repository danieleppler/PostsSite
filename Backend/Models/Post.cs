using System.Text.Json.Serialization;

namespace Backend.Models;

public class Post
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
