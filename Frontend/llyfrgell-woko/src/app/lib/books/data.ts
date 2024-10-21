import { sql, QueryResult, QueryResultRow } from "@vercel/postgres";

function convertToBook(result: QueryResult<QueryResultRow>) {
    const books = result.rows.map(row => ({
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

    return books;
}

export async function fetchBookById(id: string) {
    const result = await sql`SELECT * FROM books WHERE id=${id};`;

    return convertToBook(result)[0];
}