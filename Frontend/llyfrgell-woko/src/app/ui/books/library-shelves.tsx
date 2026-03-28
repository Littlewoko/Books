"use client";

import { Book } from "@/app/lib/classes/book";
import { Shelf } from "./all-table";

interface Props {
    books: Book[];
}

export default function LibraryShelves({ books }: Props) {
    const grouped = new Map<string, Book[]>();
    for (const book of books) {
        const genre = (book.genre || "Uncategorised").trim();
        if (!grouped.has(genre)) grouped.set(genre, []);
        grouped.get(genre)!.push(book);
    }

    const genres = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="flex flex-col gap-6">
            {genres.map(([genre, genreBooks]) => (
                <div key={genre}>
                    <h2
                        className="text-amber-200/80 text-lg mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        style={{ fontFamily: 'var(--font-caveat)' }}
                    >
                        {genre}
                    </h2>
                    <div className="h-[10px] mx-2 sm:mx-0 bg-gradient-to-b from-stone-600/50 via-stone-700/60 to-stone-800/70 shadow-md shadow-black/30" />
                    <Shelf books={genreBooks} animateFrom={0} />
                </div>
            ))}
            {genres.length === 0 && (
                <p className="text-stone-500 text-center py-8 text-sm">No books in the catalogue</p>
            )}
        </div>
    );
}
