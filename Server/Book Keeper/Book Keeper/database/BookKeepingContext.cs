using Book_Keeper.Models;
using Microsoft.EntityFrameworkCore;

public class BookKeepingContext : DbContext
{
    public DbSet<Book> Books {  get; set; }   
    public BookKeepingContext(DbContextOptions<BookKeepingContext> options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {

    }
}
