import sharp from 'sharp';

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        const buffer = Buffer.from(await response.arrayBuffer());

        const { dominant } = await sharp(buffer)
            .resize(50, 50, { fit: 'cover' })
            .stats();

        const hex = '#' + [dominant.r, dominant.g, dominant.b]
            .map(c => c.toString(16).padStart(2, '0'))
            .join('');

        return hex;
    } catch (error) {
        console.error('Error extracting colour:', error);
        return null;
    }
}
