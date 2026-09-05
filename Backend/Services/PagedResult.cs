namespace Backend.Services;

public record PagedResult<T>(List<T> Items, int TotalCount);
