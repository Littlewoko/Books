"use client";

import { Book } from "@/app/lib/classes/book";
import BookSpine from "./book-spine";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

interface TableProps {
    books: Book[]
    returnTo?: string
}

function HorizontalStack({ books, animateFrom, returnTo }: { books: Book[]; animateFrom: number; returnTo?: string }) {
    return (
        <div className="flex flex-col items-start px-4">
            {books.map((book, i) => {
                const isNew = i >= animateFrom;
                return (
                    <Link href={`/books/${book.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} key={book.id} className="block group">
                        <div
                            className={`transition-transform duration-200 group-hover:translate-x-3 ${isNew ? 'animate-shelf-drop' : ''}`}
                            style={isNew ? { animationDelay: `${(i - animateFrom) * 40}ms` } : undefined}
                        >
                            <BookSpine book={book} horizontal />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function Shelf({ books, animateFrom, returnTo }: { books: Book[]; animateFrom: number; returnTo?: string }) {
    const shelfRef = useRef<HTMLDivElement>(null);
    const [rows, setRows] = useState<Book[][]>([books]);

    const calculateRows = useCallback(() => {
        if (!shelfRef.current) return;

        const container = shelfRef.current;
        const availableWidth = container.offsetWidth - 32;
        const gap = 4;

        const spineEls = container.querySelectorAll<HTMLElement>('[data-spine]');
        if (!spineEls.length) return;

        const widths: number[] = [];
        spineEls.forEach(el => widths.push(el.offsetWidth));

        const newRows: Book[][] = [];
        let currentRow: Book[] = [];
        let currentWidth = 0;

        books.forEach((book, i) => {
            const spineWidth = widths[i] || 50;
            const needed = currentRow.length > 0 ? spineWidth + gap : spineWidth;

            if (currentWidth + needed > availableWidth && currentRow.length > 0) {
                newRows.push(currentRow);
                currentRow = [book];
                currentWidth = spineWidth;
            } else {
                currentRow.push(book);
                currentWidth += needed;
            }
        });
        if (currentRow.length) newRows.push(currentRow);

        setRows(newRows);
    }, [books]);

    useEffect(() => {
        const timer = setTimeout(calculateRows, 50);
        const observer = new ResizeObserver(() => calculateRows());
        if (shelfRef.current) observer.observe(shelfRef.current);
        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [calculateRows]);

    // Track the global index of each book for animation offset
    const bookGlobalIndex = new Map<number | undefined, number>();
    let idx = 0;
    for (const row of rows) {
        for (const book of row) {
            bookGlobalIndex.set(book.id, idx++);
        }
    }

    let newBookCount = 0;

    return (
        <div className="relative mx-2 sm:mx-0" ref={shelfRef}>
            {/* Top shelf / ceiling */}
            <div className="relative h-[10px] bg-gradient-to-t from-stone-800/70 via-stone-900/80 to-stone-950/90 shadow-sm shadow-black/20" />

            {/* Side walls */}
            <div className="absolute left-0 top-0 bottom-0 w-[8px] sm:w-[5px] bg-stone-700 z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-[8px] sm:w-[5px] bg-stone-700 z-10" />

            {rows.map((row, rowIndex) => (
                <div key={rowIndex}>
                    <div className="relative bg-gradient-to-b from-stone-900/60 to-stone-950/80">
                        <div className="px-4 pt-3 pb-0">
                            <div className="flex flex-nowrap gap-1 items-end overflow-hidden">
                                {row.map((book) => {
                                    const globalIdx = bookGlobalIndex.get(book.id) ?? 0;
                                    const isNew = globalIdx >= animateFrom;
                                    const delay = isNew ? newBookCount++ * 20 : 0;
                                    return (
                                        <div
                                            key={book.id}
                                            data-spine
                                            className={isNew ? 'animate-shelf-drop' : ''}
                                            style={isNew ? { animationDelay: `${delay}ms` } : undefined}
                                        >
                                            <BookSpine book={book} returnTo={returnTo} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Shelf base divider */}
                    <div className="relative h-[10px] bg-gradient-to-b from-stone-700/60 via-stone-800/70 to-stone-900/80 shadow-md shadow-black/30" />
                </div>
            ))}
            {/* Bottom of bookcase */}
            <div className="h-[6px] bg-gradient-to-b from-stone-700/70 to-stone-800/90" />
        </div>
    );
}

const Table: React.FC<TableProps> = ({ books, returnTo }) => {
    const prevCountRef = useRef(0);
    const [animateFrom, setAnimateFrom] = useState(0);

    useEffect(() => {
        if (books.length === prevCountRef.current) return;
        // On first load or filter reset, animate all; on load-more, animate only new
        setAnimateFrom(prevCountRef.current);
        prevCountRef.current = books.length;
    }, [books.length]);

    const inProgress = books.filter(b => b.dateStartedReading && !b.dateCompleted);
    const shelved = books.filter(b => !b.dateStartedReading || !!b.dateCompleted);

    // Calculate how many in-progress books came before the animate threshold
    const inProgressAnimateFrom = Math.max(0, Math.min(animateFrom, inProgress.length));
    const shelvedAnimateFrom = Math.max(0, animateFrom - inProgress.length);

    return (
        <div className="flex flex-col">
            {inProgress.length > 0 && (
                <HorizontalStack books={inProgress} animateFrom={inProgressAnimateFrom} returnTo={returnTo} />
            )}
            {/* Bookcase top surface */}
            {shelved.length > 0 && (
                <>
                    <div className="h-[10px] mx-2 sm:mx-0 bg-gradient-to-b from-stone-600/50 via-stone-700/60 to-stone-800/70 shadow-md shadow-black/30" />
                    <Shelf books={shelved} animateFrom={shelvedAnimateFrom} returnTo={returnTo} />
                </>
            )}
        </div>
    );
}

export default Table;
