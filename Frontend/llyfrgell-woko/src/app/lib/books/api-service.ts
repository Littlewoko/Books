export interface BookSearchResult {
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    description?: string;
    coverImageUrl?: string;
    publishedDate?: string;
    spineColor?: string;
}

export async function searchBooksByTitle(title: string, author?: string, isbn?: string): Promise<BookSearchResult[]> {
    let query: string;
    
    if (isbn) {
        query = `isbn:${isbn}`;
    } else if (title && author) {
        query = `intitle:${title}+inauthor:${author}`;
    } else if (title) {
        query = `intitle:${title}`;
    } else if (author) {
        query = `inauthor:${author}`;
    } else {
        return [];
    }
    
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${process.env.GOOGLE_BOOKS_KEY}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
            cache: 'no-store',
        });
        
        if (!response.ok) {
            console.error(`Google Books API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return [];
        }

        return data.items.map((item: any) => {
            const volumeInfo = item.volumeInfo;
            const isbn13 = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
            const isbn10 = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;

            return {
                title: volumeInfo.title || '',
                author: volumeInfo.authors?.[0] || '',
                isbn: isbn13 || isbn10 || undefined,
                genre: volumeInfo.categories?.[0] || undefined,
                description: volumeInfo.description || undefined,
                coverImageUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || undefined,
                publishedDate: volumeInfo.publishedDate || undefined,
            };
        });
    } catch (error) {
        console.error('Error searching books:', error);
        return [];
    }
}
