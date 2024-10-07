import { getDummyBooks } from "./lib/dummy/books";

export default function Home() {
  const books = getDummyBooks();

  const booksItems = books.map((book) => (
    <tr key={book.title}>
      <td>{book.title}</td>
      <td>{book.author}</td>
      <td>{book.genre}</td>
    </tr>
  ));

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
          </tr>
        </thead>
        <tbody>
          {booksItems}

        </tbody>


      </table>
    </div>
  );
}
