using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Models;

public enum PostCategory
{
    BuyAndSale,
    Events
}

public static class PostCategoryValues
{
    public const string BuyAndSale = "buy&sale";
    public const string Events = "events";

    public static bool TryParse(string? value, out PostCategory category)
    {
        switch (value)
        {
            case BuyAndSale:
                category = PostCategory.BuyAndSale;
                return true;
            case Events:
                category = PostCategory.Events;
                return true;
            default:
                category = default;
                return false;
        }
    }

    public static string ToStringValue(PostCategory category) => category switch
    {
        PostCategory.BuyAndSale => BuyAndSale,
        PostCategory.Events => Events,
        _ => throw new ArgumentOutOfRangeException(nameof(category))
    };
}

public class PostCategoryJsonConverter : JsonConverter<PostCategory>
{
    public override PostCategory Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return PostCategoryValues.TryParse(value, out var category)
            ? category
            : throw new JsonException($"Unknown PostCategory value: {value}");
    }

    public override void Write(Utf8JsonWriter writer, PostCategory value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(PostCategoryValues.ToStringValue(value));
    }
}
