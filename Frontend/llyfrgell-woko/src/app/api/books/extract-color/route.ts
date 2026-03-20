import { NextRequest, NextResponse } from 'next/server';
import { extractDominantColor } from '@/app/utils/extractColor';

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
        }

        const color = await extractDominantColor(imageUrl);
        return NextResponse.json({ color });
    } catch (error) {
        console.error('Error in extract-color API:', error);
        return NextResponse.json({ error: 'Failed to extract colour' }, { status: 500 });
    }
}
