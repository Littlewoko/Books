import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";
import { Book } from "../lib/classes/book";
import AllTable from "../ui/books/all-table";
import QuickAddForm from "../ui/books/quick-add";
import React from "react";
import { defaultSort } from "../utils/sortBooks";
import CreateBookForm from "../ui/books/create-form";

export default async function Page() {
  let books: Book[];

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
      shortStory: row.shortstory
    }));
  } catch (error) {
    console.log(error);
    books = [];
  }

  const sortedBooks = defaultSort(books);

  return (
    <div className="overflow-x-auto m-2">
      <div className="flex flex-col m-1 gap-y-1">
        <QuickAddForm Form={<CreateBookForm />}/>
      </div>

      <AllTable books={sortedBooks} />
    </div>
  );
}
