'use server';

import { QueryResult, QueryResultRow, sql } from '@vercel/postgres';
import { Book } from '../classes/book';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ProtectRoute from '@/app/utils/protectRoute';
import { convertToBook } from './data';
import { GetBooksRequest } from './sql';

function getBookFromFormData(formData: FormData): Book {
    const ratingValue = formData.get('rating');
    const book: Book = {
        title: formData.get('title') as string,
        author: formData.get('author') as string,
        genre: formData.get('genre') as string,
        isbn: formData.get('isbn') as string | null,
        dateObtained: formData.get('dateobtained') ? new Date(formData.get('dateobtained') as string) : null,
        dateStartedReading: formData.get('datestartedreading') ? new Date(formData.get('datestartedreading') as string) : null,
        dateCompleted: formData.get('datecompleted') ? new Date(formData.get('datecompleted') as string) : null,
        shortStory: formData.get('shortStory') != null,
        rating: ratingValue ? Number(ratingValue) : null,
        review: formData.get('review') as string | null,
        coverImageUrl: formData.get('coverImageUrl') as string | null,
        description: formData.get('description') as string | null,
        spineColor: formData.get('spineColor') as string | null,
        currentPage: formData.get('currentPage') ? Number(formData.get('currentPage')) : null,
    };

    return book;
}

export async function createBook(formData: FormData) {
    await ProtectRoute();

    const book: Book = getBookFromFormData(formData);

    await sql`INSERT INTO books (title, author, genre, isbn, dateobtained, datecompleted, datestartedreading, shortstory, rating, review, coverimageurl, description, apidatafetchedat, spinecolor, currentpage)
        VALUES (
            ${book.title}, 
            ${book.author}, 
            ${book.genre}, 
            ${book.isbn ?? null}, 
            ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
            ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null}, 
            ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
            ${book.shortStory},
            ${book.rating ?? null},
            ${book.review ?? null},
            ${book.coverImageUrl ?? null},
            ${book.description ?? null},
            ${book.coverImageUrl || book.description ? new Date().toISOString() : null},
            ${book.spineColor ?? null},
            ${book.currentPage ?? null});`

    revalidatePath('/books');
    redirect('/books');
}

export async function GetBooks(page: number, pageSize: number, search: string, filters?: {
    shortStory?: boolean | null;
    genre?: string;
    status?: string;
    year?: number;
}): Promise<Book[]> {
    let books: Book[];

    const skip = pageSize * page;

    try {
        const result: QueryResult<QueryResultRow> = await GetBooksRequest(skip, pageSize, search, filters);

        books = convertToBook(result);

    } catch (error) {
        console.log(error);
        books = [];
    }

    return books;
}

export async function UpdateBook(id: string, formData: FormData) {
    await ProtectRoute();

    const book: Book = getBookFromFormData(formData);
    const returnTo = formData.get('returnTo') as string | null;

    await sql`UPDATE books SET 
                title = ${book.title},
                author = ${book.author}, 
                genre = ${book.genre}, 
                isbn = ${book.isbn ?? null}, 
                dateobtained = ${book.dateObtained ? book.dateObtained.toISOString().split('T')[0] : null}, 
                datecompleted = ${book.dateCompleted ? book.dateCompleted.toISOString().split('T')[0] : null},
                datestartedreading = ${book.dateStartedReading ? book.dateStartedReading.toISOString().split('T')[0] : null}, 
                shortstory = ${book.shortStory},
                rating = ${book.rating ?? null},
                review = ${book.review ?? null},
                coverimageurl = ${book.coverImageUrl ?? null},
                description = ${book.description ?? null},
                apidatafetchedat = ${book.coverImageUrl || book.description ? new Date().toISOString() : null},
                spinecolor = ${book.spineColor ?? null},
                currentpage = ${book.currentPage ?? null}
            WHERE id=${id};`;

    revalidatePath('/books');
    redirect(returnTo || `/books/${id}`);
}

export async function QuickCompleteBook(id: string, formData: FormData) {
    await ProtectRoute();

    const dateCompleted = formData.get('dateCompleted') as string;
    const rating = formData.get('rating') ? Number(formData.get('rating')) : null;
    const review = (formData.get('review') as string) || null;
    const setStarted = formData.get('setStarted') === 'true';
    const returnTo = formData.get('returnTo') as string | null;

    if (setStarted) {
        await sql`UPDATE books SET
            datecompleted = ${dateCompleted},
            datestartedreading = COALESCE(datestartedreading, ${dateCompleted}),
            rating = ${rating},
            review = CASE WHEN ${review}::text IS NOT NULL THEN ${review} ELSE review END
            WHERE id = ${id};`;
    } else {
        await sql`UPDATE books SET
            datecompleted = ${dateCompleted},
            rating = ${rating},
            review = CASE WHEN ${review}::text IS NOT NULL THEN ${review} ELSE review END
            WHERE id = ${id};`;
    }

    revalidatePath('/books');
    redirect(returnTo || `/books/${id}`);
}

export async function UpdateCurrentPage(id: string, page: number | null) {
    await ProtectRoute();

    await sql`UPDATE books SET currentpage = ${page} WHERE id = ${id};`;

    revalidatePath('/books');
    revalidatePath(`/books/${id}`);
}

export async function DeleteBook(id: string, returnTo?: string) {
    await ProtectRoute();

    await sql`DELETE FROM books WHERE id = ${id}`;

    revalidatePath('/books');
    redirect(returnTo || '/books');
}

