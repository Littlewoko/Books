using Book_Keeper.Models;

namespace Book_Keeper.Repositories;

public class BookRepository(BookKeepingContext context) : IBookRepository
{
    BookKeepingContext _context = context;

    public void AddBook(Book book)
    {
        throw new NotImplementedException();
    }

    public bool BookExists(Book book)
    {
        throw new NotImplementedException();
    }

    public Book GetBookById(int id)
    {
        throw new NotImplementedException();
    }
}
