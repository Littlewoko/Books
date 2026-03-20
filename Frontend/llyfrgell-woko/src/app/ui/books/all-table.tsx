"use client";

import { Book } from "@/app/lib/classes/book";
import BookSpine from "./book-spine";
import { Typography } from "@mui/material";
import { useRef, useState, useEffect, useCallback } from "react";

interface TableProps {
    books: Book[]
}

interface ShelfGroup {
    label: string;
    books: Book[];
    color: string;
}

function groupBooks(books: Book[]): ShelfGroup[] {
    const inProgress = books.filter(b => b.dateStartedReading && !b.dateCompleted);
    const completed = books.filter(b => !!b.dateCompleted);
    const owned = books.filter(b => b.dateObtained && !b.dateStartedReading && !b.dateCompleted);
    const notOwned = books.filter(b => !b.dateObtained && !b.dateStartedReading && !b.dateCompleted);

    const rows: ShelfGroup[] = [];
    if (inProgress.length) rows.push({ label: 'Currently Reading', books: inProgress, color: 'text-violet-400' });
    if (completed.length) rows.push({ label: 'Completed', books: completed, color: 'text-yellow-500' });
    if (owned.length) rows.push({ label: 'On the Shelf', books: owned, color: 'text-slate-400' });
    if (notOwned.length) rows.push({ label: 'Wishlist', books: notOwned, color: 'text-slate-500' });
    return rows;
}

function Shelf({ group }: { group: ShelfGroup }) {
    const shelfRef = useRef<HTMLDivElement>(null);
    const [rows, setRows] = useState<Book[][]>([group.books]);

    const calculateRows = useCallback(() => {
        if (!shelfRef.current) return;

        const container = shelfRef.current;
        const availableWidth = container.offsetWidth - 32; // px-4 padding on each side
        const gap = 4; // gap-1

        // Measure each spine's actual width
        const spineEls = container.querySelectorAll<HTMLElement>('[data-spine]');
        if (!spineEls.length) return;

        const widths: number[] = [];
        spineEls.forEach(el => widths.push(el.offsetWidth));

        const newRows: Book[][] = [];
        let currentRow: Book[] = [];
        let currentWidth = 0;

        group.books.forEach((book, i) => {
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
    }, [group.books]);

    useEffect(() => {
        // Small delay to let spines render and get their natural widths
        const timer = setTimeout(calculateRows, 50);
        const observer = new ResizeObserver(() => calculateRows());
        if (shelfRef.current) observer.observe(shelfRef.current);
        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [calculateRows]);

    return (
        <div key={group.label}>
            <Typography className={`${group.color} mb-2 ml-2`} sx={{ fontSize: { xs: '11px', sm: '13px' }, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {group.label}
            </Typography>

            <div className="relative" ref={shelfRef}>
                {/* Top shelf / ceiling */}
                <div className="relative h-[10px] bg-gradient-to-t from-stone-800/70 via-stone-900/80 to-stone-950/90 shadow-sm shadow-black/20" />

                {/* Side walls */}
                <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l bg-gradient-to-r from-stone-800/80 to-stone-700/30 z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-[6px] rounded-r bg-gradient-to-l from-stone-800/80 to-stone-700/30 z-10" />

                {rows.map((row, rowIndex) => (
                    <div key={rowIndex}>
                        {/* Back panel per row */}
                        <div className="relative bg-gradient-to-b from-stone-900/60 to-stone-950/80">
                            <div className="px-4 pt-3 pb-0">
                                <div className="flex flex-wrap gap-1 items-end">
                                    {row.map((book) => (
                                        <div key={book.id} data-spine>
                                            <BookSpine book={book} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shelf base divider */}
                        <div className="relative h-[10px] bg-gradient-to-b from-stone-700/60 via-stone-800/70 to-stone-900/80 shadow-md shadow-black/30" />
                    </div>
                ))}
            </div>
        </div>
    );
}

const Table: React.FC<TableProps> = ({ books }) => {
    const shelves = groupBooks(books);

    return (
        <div className="flex flex-col gap-8">
            {shelves.map((shelf) => (
                <Shelf key={shelf.label} group={shelf} />
            ))}
        </div>
    );
}

export default Table;
