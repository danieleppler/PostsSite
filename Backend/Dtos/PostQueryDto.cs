namespace Backend.Dtos;

//Input via GET /
public class PostQueryDto
{
    public int? PageNumber { get; set; }
    public int? ItemCount { get; set; }
    public string? Q { get; set; }
    public string? Category { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? SortBy { get; set; }
}
