import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";
import { Book } from "../lib/classes/book";
import AllTable from "../ui/books/all-table";
import { getServerSession } from "next-auth";
import QuickAddForm from "../ui/books/quick-add";
import React from "react";
import { sortBydateStartedReading } from "../utils/sortBooks";

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
      considerTowardsTotalBooksCompleted: row.considerTowardsTotalBooksCompleted
    }));
  } catch (error) {
    console.log(error);
    books = [];
  }
  
  const sortedBooks = sortBydateStartedReading(books);

  const session = await getServerSession();
  const hasSession = session && session.user;

  return (
    <div className="overflow-x-auto">
      {hasSession ? <QuickAddForm /> : <></>}
      <AllTable books={sortedBooks} />
    </div>
  );
}
