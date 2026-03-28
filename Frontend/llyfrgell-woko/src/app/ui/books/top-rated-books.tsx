interface TopRatedBooksProps {
    books: any[];
}

export default function TopRatedBooks({ books }: TopRatedBooksProps) {
    return (
        <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4">
            <h2
                className="text-amber-200/80 text-lg mb-4"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Top Rated Books
            </h2>
            <div className="space-y-3">
                {books.map((book, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-stone-800/50 transition-colors">
                        <span className="text-amber-200/90 font-semibold text-lg min-w-[45px]">
                            {book.rating} ★
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-amber-100/80 text-sm">{book.title}</p>
                            <p className="text-stone-400 text-xs">{book.author}</p>
                        </div>
                    </div>
                ))}
            </div>
            {books.length === 0 && (
                <p className="text-stone-500 text-center py-8 text-sm">No rated books yet</p>
            )}
        </div>
    );
}
