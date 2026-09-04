namespace Backend.Dtos;

//Input via GET /
public class PostQueryDto
{
    public int? PageNumber { get; set; }
    public int? ItemCount { get; set; }
}
