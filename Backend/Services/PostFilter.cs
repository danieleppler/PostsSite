using Backend.Models;

namespace Backend.Services;

public record PostFilter(string? Search, PostCategory? Category, DateTime? DateFrom, DateTime? DateTo);
