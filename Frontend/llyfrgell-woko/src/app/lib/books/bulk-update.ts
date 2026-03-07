'use server';

import { sql } from '@vercel/postgres';
import { searchBooksByTitle } from './api-service';
import ProtectRoute from '@/app/utils/protectRoute';

export interface BulkUpdateResult {
    bookId: number;
    title: string;
    success: boolean;
    fieldsUpdated: string[];
    error?: string;
    progress?: { current: number; total: number };
}

export async function getBooksWithMissingData() {
    await ProtectRoute();
    
    const result = await sql`
        SELECT id, title, author, coverimageurl, description, isbn
        FROM books
        WHERE coverimageurl IS NULL OR description IS NULL OR isbn IS NULL
        ORDER BY title;
    `;
    
    return result.rows;
}

export async function updateSingleBook(book: any, current: number, total: number): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = {
        bookId: book.id,
        title: book.title,
        success: false,
        fieldsUpdated: [],
        progress: { current, total },
    };
    
    try {
        const searchResults = await searchBooksByTitle(book.title, book.author);
        
        if (searchResults.length === 0) {
            result.error = 'No API results found';
            return result;
        }
        
        const apiBook = searchResults[0];
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (!book.coverimageurl && apiBook.coverImageUrl) {
            updates.push(`coverimageurl = $${paramIndex++}`);
            values.push(apiBook.coverImageUrl);
            result.fieldsUpdated.push('coverImageUrl');
        }
        
        if (!book.description && apiBook.description) {
            updates.push(`description = $${paramIndex++}`);
            values.push(apiBook.description);
            result.fieldsUpdated.push('description');
        }
        
        if (!book.isbn && apiBook.isbn) {
            updates.push(`isbn = $${paramIndex++}`);
            values.push(apiBook.isbn);
            result.fieldsUpdated.push('isbn');
        }
        
        if (updates.length > 0) {
            updates.push(`apidatafetchedat = $${paramIndex++}`);
            values.push(new Date().toISOString());
            values.push(book.id);
            
            const query = `
                UPDATE books 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex};
            `;
            
            await sql.query(query, values);
            result.success = true;
        } else {
            result.error = 'No missing fields to update';
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return result;
}
