import sharp from 'sharp';

const ALLOWED_HOSTS = [
    'books.google.com',
    'books.googleapis.com',
    'covers.openlibrary.org',
    'images-na.ssl-images-amazon.com',
    'i.gr-assets.com',
];

function isAllowedUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
        return ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
    } catch {
        return false;
    }
}

function sanitizeLog(input: string): string {
    return input.replace(/[\r\n\t]/g, ' ').substring(0, 200);
}

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
    try {
        if (!isAllowedUrl(imageUrl)) {
            console.error('Blocked request to untrusted host:', sanitizeLog(imageUrl));
            return null;
        }

        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) return null;

        const buffer = Buffer.from(arrayBuffer);

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
