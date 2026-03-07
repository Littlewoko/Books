import { NextRequest, NextResponse } from 'next/server';
import { searchBooksByTitle } from '@/app/lib/books/api-service';

export async function POST(request: NextRequest) {
    try {
        const { title, author } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const results = await searchBooksByTitle(title, author);
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error in book search API:', error);
        return NextResponse.json({ error: 'Failed to search books' }, { status: 500 });
    }
}
