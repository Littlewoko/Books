import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { getDummyBooks } from "../../lib/dummy/books";
import { Book } from "../../lib/classes/book";

export async function GET(request: Request) {
    // const books: Book[] = getDummyBooks();

    // try {
    //     books.forEach(async book => {
    //         await sql`INSERT INTO books (title, author, genre, isbn, dateobtained, datecompleted, datestartedreading, considertowardstotalbookscompleted)
    //         VALUES (
    //             ${book.title}, 
    //             ${book.author}, 
    //             ${book.genre}, 
    //             ${book.isbn}, 
    //             ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
    //             ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null}, 
    //             ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
    //             ${book.considerTowardsTotalBooksCompleted});`
    //     });
    // } catch (error) {
    //     return NextResponse.json({ error }, { status: 500});
    // }

    const booksInDB = await sql`SELECT * FROM books;`;
    return NextResponse.json({ booksInDB }, { status: 200 });
}