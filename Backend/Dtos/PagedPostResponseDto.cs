namespace Backend.Dtos;


//output via Get /
public class PagedPostResponseDto
{
    public int PageNumber { get; set; }
    public int ItemCount { get; set; }
    public List<PostResponseDto> Items { get; set; } = new();
}
