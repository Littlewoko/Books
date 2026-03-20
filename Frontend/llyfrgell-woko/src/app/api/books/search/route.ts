import { NextRequest, NextResponse } from 'next/server';
import { searchBooksByTitle } from '@/app/lib/books/api-service';

export async function POST(request: NextRequest) {
    try {
        const { title, author, isbn } = await request.json();

        if (!title && !isbn && !author) {
            return NextResponse.json({ error: 'At least one search field is required' }, { status: 400 });
        }

        const results = await searchBooksByTitle(title, author, isbn);
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error in book search API:', error);
        return NextResponse.json({ error: 'Failed to search books' }, { status: 500 });
    }
}
