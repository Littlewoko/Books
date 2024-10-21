'use server';

import { sql } from '@vercel/postgres';
import { Book } from '../classes/book';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function getBookFromFormData(formData: FormData): Book {
    const book: Book = {
        title: formData.get('title') as string,
        author: formData.get('author') as string,
        genre: formData.get('genre') as string,
        isbn: formData.get('isbn') as string | null,
        dateObtained: formData.get('dateobtained') ? new Date(formData.get('dateobtained') as string) : null,
        dateStartedReading: formData.get('datestartedreading') ? new Date(formData.get('datestartedreading') as string) : null,
        dateCompleted: formData.get('datecompleted') ? new Date(formData.get('datecompleted') as string) : null,
        considerTowardsTotalBooksCompleted: formData.get('consider') == null
    };

    return book;
}
// TODO: fix form validation, allow nullables and parse dates correctly
export async function createBook(formData: FormData) {
    const book: Book = getBookFromFormData(formData);

    await sql`INSERT INTO books (title, author, genre, isbn, dateobtained, datecompleted, datestartedreading, considertowardstotalbookscompleted)
        VALUES (
            ${book.title}, 
            ${book.author}, 
            ${book.genre}, 
            ${book.isbn ?? null}, 
            ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
            ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null}, 
            ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
            ${book.considerTowardsTotalBooksCompleted ? "true" : "false"});`

    revalidatePath('/books');
    redirect('/books');
}

export async function UpdateBook(id: string, formData: FormData) {
    const book: Book = getBookFromFormData(formData);

    console.log(book.isbn ?? null)
    await sql`UPDATE books SET 
                title = ${book.title},
                author = ${book.author}, 
                genre = ${book.genre}, 
                isbn = ${book.isbn ?? null}, 
                dateobtained = ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
                datecompleted = ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null},
                datestartedreading = ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
                considertowardstotalbookscompleted = ${book.considerTowardsTotalBooksCompleted ? "true" : "false"}
            WHERE id=${id};`;

    revalidatePath('/books');
    redirect('/books');
}