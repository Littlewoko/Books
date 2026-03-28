"use client";

import Link from "next/link";

interface MonthlyBooksProps {
    data: any[];
}

function BookCover({ book }: { book: any }) {
    return (
        <Link href={`/books/${book.id}/edit`}>
            <div className="group relative aspect-[2/3] rounded-sm overflow-hidden shadow-md shadow-black/40 cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/60">
                {/* Spine edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black/30 z-20" />

                {/* Cover image or fallback */}
                {book.coverimageurl ? (
                    <img
                        src={book.coverimageurl}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-700 to-stone-800 flex items-center justify-center px-2">
                        <p
                            className="text-amber-100/80 text-center text-sm leading-tight"
                            style={{ fontFamily: 'var(--font-caveat)' }}
                        >
                            {book.title}
                        </p>
                    </div>
                )}

                {/* Bottom overlay with title & author */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-8 pb-2 px-2 z-10">
                    <p className="text-amber-100/90 text-[11px] font-medium leading-tight line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                        {book.title}
                    </p>
                    <p className="text-stone-300/70 text-[10px] leading-tight line-clamp-1 mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                        {book.author}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default function MonthlyBooks({ data }: MonthlyBooksProps) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();

    const booksByMonth = months.map((month, index) => {
        const monthNum = index + 1;
        const books = data.filter(book => Number(book.month) === monthNum);
        return { month, books };
    }).filter(item => item.books.length > 0);

    return (
        <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4">
            <h2
                className="text-amber-200/80 text-lg mb-4"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Completed in {currentYear}
            </h2>
            <div className="space-y-6">
                {booksByMonth.map((item) => (
                    <div key={item.month}>
                        <p className="text-stone-400 text-sm font-semibold mb-3">{item.month}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {item.books.map((book: any) => (
                                <BookCover key={book.id} book={book} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {booksByMonth.length === 0 && (
                <p className="text-stone-500 text-center py-8 text-sm">Nothing completed this year</p>
            )}
        </div>
    );
}
