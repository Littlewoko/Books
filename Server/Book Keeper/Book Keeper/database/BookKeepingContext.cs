using Microsoft.EntityFrameworkCore;

public class BookKeepingContext : DbContext
{
    public BookKeepingContext(DbContextOptions<BookKeepingContext> options) : base(options)
    {
    }

}
