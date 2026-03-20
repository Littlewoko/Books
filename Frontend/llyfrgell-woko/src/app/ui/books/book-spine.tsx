"use client";

import { Book } from '@/app/lib/classes/book';
import Link from 'next/link';

interface Props {
    book: Book
}

const spineColors = [
    'from-amber-800 to-amber-900',
    'from-emerald-800 to-emerald-900',
    'from-red-900 to-red-950',
    'from-indigo-800 to-indigo-950',
    'from-stone-700 to-stone-800',
    'from-cyan-800 to-cyan-900',
    'from-violet-800 to-violet-950',
    'from-rose-800 to-rose-900',
    'from-teal-800 to-teal-900',
    'from-orange-800 to-orange-950',
    'from-sky-800 to-sky-900',
    'from-fuchsia-800 to-fuchsia-950',
];

function getSpineColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return spineColors[Math.abs(hash) % spineColors.length];
}

export default function BookSpine({ book }: Props) {
    const color = getSpineColor(book.title);

    return (
        <Link href={`/books/${book.id}`} className="block group">
            <div className={`relative w-[44px] sm:w-[50px] h-[220px] sm:h-[260px] rounded-sm overflow-hidden shadow-md shadow-black/40 group-hover:shadow-lg group-hover:shadow-black/60 group-hover:-translate-y-2 transition-transform duration-200 bg-gradient-to-b ${color}`}>
                {/* Spine left edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black/25" />
                {/* Spine right edge */}
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/10" />

                {/* Thumbnail */}
                {book.coverImageUrl && (
                    <div className="mx-auto mt-2 w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                        <img
                            src={book.coverImageUrl}
                            alt={book.title}
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                {/* Title - sideways */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] sm:w-[190px]" style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}>
                    <p className="text-amber-100/90 text-[10px] sm:text-xs font-medium text-center truncate leading-tight">
                        {book.title}
                    </p>
                    <p className="text-amber-100/50 text-[8px] sm:text-[9px] text-center truncate leading-tight mt-0.5">
                        {book.author}
                    </p>
                </div>
            </div>
        </Link>
    );
}
