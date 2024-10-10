import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";
import { Book } from "../lib/classes/book";
import { getDummyBooks } from "../lib/dummy/books";
import AllTable from "../ui/books/all-table";

export default async function Page() {
  let books: Book[];

  const useDatabase = false;
  if(useDatabase) {
    try {
      const result: QueryResult<QueryResultRow> = await sql`SELECT * FROM books;`;
  
      books = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        author: row.author,
        genre: row.genre,
        isbn: row.isbn,
        dateObtained: row.dateobtained ? new Date(row.dateobtained) : null,
        dateCompleted: row.datecompleted ? new Date(row.datecompleted) : null,
        dateStartedReading: row.datestartedreading ? new Date(row.datestartedreading) : null,
        considerTowardsTotalBooksCompleted: row.considerTowardsTotalBooksCompleted
      }));
    } catch (error) {
      console.log(error);
      books = [];
    }
  } else {
    books = getDummyBooks()
  }

  return (
    <div>
      <AllTable books={books} />
    </div>
  );
}
