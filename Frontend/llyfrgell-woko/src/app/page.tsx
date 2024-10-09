//import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";
import { Book } from "./lib/classes/book";
import { getDummyBooks } from "./lib/dummy/books";

export default async function Home() {
  let books: Book[];
  // try {
  //   const result: QueryResult<QueryResultRow> = await sql`SELECT * FROM books;`;

  //   books = result.rows.map(row => ({
  //     id: row.id,
  //     title: row.title,
  //     author: row.author,
  //     genre: row.genre,
  //     isbn: row.isbn,
  //     dateObtained: row.dateobtained ? new Date(row.dateobtained) : null,
  //     dateCompleted: row.datecompleted ? new Date(row.datecompleted) : null,
  //     dateStartedReading: row.datestartedreading ? new Date(row.datestartedreading) : null,
  //     considerTowardsTotalBooksCompleted: row.considerTowardsTotalBooksCompleted
  //   }));
  // } catch (error) {
  //   console.log(error);
  //   books = [];
  // }

  books = getDummyBooks();

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
          {booksItems.length > 0 ? booksItems : 'Uh oh! no books'}
        </tbody>
      </table>
    </div>
  );
}
