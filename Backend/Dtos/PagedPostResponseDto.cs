namespace Backend.Dtos;


//output via Get /
public class PagedPostResponseDto
{
    public PagedPostResponseDto(int pageNumber, int itemCount, int totalCount, int totalPages, List<PostResponseDto> items)
    {
        PageNumber = pageNumber;
        ItemCount = itemCount;
        TotalCount = totalCount;
        TotalPages = totalPages;
        Items = items;
    }

    public int PageNumber { get; set; }
    public int ItemCount { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public List<PostResponseDto> Items { get; set; } = new();
}
