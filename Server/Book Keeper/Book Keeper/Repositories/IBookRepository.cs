using Book_Keeper.Models;

namespace Book_Keeper.Repositories;

public interface IBookRepository
{
    Book GetBookById(int id);
    void AddBook(Book book);
    bool BookExists(Book book);
}
