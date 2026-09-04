namespace Backend.Services;

public class GuidIdGenerator : IIdGenerator
{
    public string? NewId() => Guid.NewGuid().ToString();
}
