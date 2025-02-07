import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";
import { Book } from "../lib/classes/book";
import AllTable from "../ui/books/all-table";
import QuickAddForm from "../ui/books/quick-add";
import React from "react";
import { defaultSort } from "../utils/sortBooks";
import CreateBookForm from "../ui/books/create-form";
import { GetBooks } from "../lib/books/actions";

export default async function Page() {
  let books = await GetBooks();

  const sortedBooks = defaultSort(books);

  return (
    <div className="overflow-x-auto m-2">
      <div className="flex flex-col m-1 gap-y-1">
        <QuickAddForm Form={<CreateBookForm />} />
      </div>

      <AllTable books={sortedBooks} />
    </div>
  );
}
