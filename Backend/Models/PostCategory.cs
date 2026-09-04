using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Models;

public enum PostCategory
{
    BuyAndSale,
    Events
}

public class PostCategoryJsonConverter : JsonConverter<PostCategory>
{
    private const string BuyAndSaleValue = "buy&sale";
    private const string EventsValue = "events";

    public override PostCategory Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            BuyAndSaleValue => PostCategory.BuyAndSale,
            EventsValue => PostCategory.Events,
            _ => throw new JsonException($"Unknown PostCategory value: {value}")
        };
    }

    public override void Write(Utf8JsonWriter writer, PostCategory value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value switch
        {
            PostCategory.BuyAndSale => BuyAndSaleValue,
            PostCategory.Events => EventsValue,
            _ => throw new JsonException($"Unknown PostCategory value: {value}")
        });
    }
}
