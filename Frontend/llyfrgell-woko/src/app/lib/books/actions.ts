'use server';

import { sql } from '@vercel/postgres';
import { Book } from '../classes/book';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// TODO: fix form validation, allow nullables and parse dates correctly
export async function createBook(formData: FormData) {
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

    const useDatabase = false;
    if (useDatabase) {
        await sql`INSERT INTO books (title, author, genre, isbn, dateobtained, datecompleted, datestartedreading, considertowardstotalbookscompleted)
        VALUES (
            ${book.title}, 
            ${book.author}, 
            ${book.genre}, 
            ${book.isbn ?? null}, 
            ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
            ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null}, 
            ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
            ${book.considerTowardsTotalBooksCompleted});`
    }

    revalidatePath('/');
    redirect('/');
}