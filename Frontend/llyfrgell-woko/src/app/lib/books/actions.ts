'use server';

import { QueryResult, QueryResultRow, sql } from '@vercel/postgres';
import { Book } from '../classes/book';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ProtectRoute from '@/app/utils/protectRoute';

function getBookFromFormData(formData: FormData): Book {
    const book: Book = {
        title: formData.get('title') as string,
        author: formData.get('author') as string,
        genre: formData.get('genre') as string,
        isbn: formData.get('isbn') as string | null,
        dateObtained: formData.get('dateobtained') ? new Date(formData.get('dateobtained') as string) : null,
        dateStartedReading: formData.get('datestartedreading') ? new Date(formData.get('datestartedreading') as string) : null,
        dateCompleted: formData.get('datecompleted') ? new Date(formData.get('datecompleted') as string) : null,
        shortStory: formData.get('shortStory') != null
    };

    return book;
}

export async function createBook(formData: FormData) {
    await ProtectRoute();
    
    const book: Book = getBookFromFormData(formData);

    await sql`INSERT INTO books (title, author, genre, isbn, dateobtained, datecompleted, datestartedreading, shortstory)
        VALUES (
            ${book.title}, 
            ${book.author}, 
            ${book.genre}, 
            ${book.isbn ?? null}, 
            ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
            ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null}, 
            ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
            ${book.shortStory});`

    revalidatePath('/books');
    redirect('/books');
}

export async function GetBooks(page: number, pageSize: number): Promise<Book[]> {
    let books: Book[];

    let skip = pageSize * page;

  try {
    const result: QueryResult<QueryResultRow> = await sql`SELECT * FROM books OFFSET ${skip} LIMIT ${pageSize};`;

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

  return books;
}

export async function UpdateBook(id: string, formData: FormData) {
    await ProtectRoute();
    
    const book: Book = getBookFromFormData(formData);

    await sql`UPDATE books SET 
                title = ${book.title},
                author = ${book.author}, 
                genre = ${book.genre}, 
                isbn = ${book.isbn ?? null}, 
                dateobtained = ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
                datecompleted = ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null},
                datestartedreading = ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
                shortstory = ${book.shortStory}
            WHERE id=${id};`;

    revalidatePath('/books');
    redirect('/books');
}

export async function DeleteBook(id: string) {
    await ProtectRoute();
    
    await sql`DELETE FROM books WHERE id = ${id}`;

    revalidatePath('/books');
    redirect('/books');
}