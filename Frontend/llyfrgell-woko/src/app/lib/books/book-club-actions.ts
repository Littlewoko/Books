'use server';

import { sql } from '@vercel/postgres';
import { BookClubNote } from '../classes/book-club-note';
import ProtectRoute from '@/app/utils/protectRoute';
import { revalidatePath } from 'next/cache';

export async function fetchNotesByBookId(bookId: string): Promise<BookClubNote[]> {
    const result = await sql`
        SELECT id, book_id, question, answer, sort_order
        FROM book_club_notes
        WHERE book_id = ${bookId}
        ORDER BY sort_order ASC;
    `;

    return result.rows.map(row => ({
        id: row.id,
        bookId: row.book_id,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sort_order,
    }));
}

export async function saveBookClubNotes(bookId: string, notes: { question: string; answer?: string | null }[]) {
    await ProtectRoute();

    await sql`DELETE FROM book_club_notes WHERE book_id = ${bookId}`;

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note.question.trim()) continue;

        await sql`
            INSERT INTO book_club_notes (book_id, question, answer, sort_order)
            VALUES (${bookId}, ${note.question}, ${note.answer || null}, ${i});
        `;
    }

    revalidatePath(`/books/${bookId}`);
}
