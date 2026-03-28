"use client";

import { Book } from '@/app/lib/classes/book';
import Link from 'next/link';
import { getBookColor, isLightColor } from '@/app/utils/bookColors';

interface Props {
    book: Book;
    horizontal?: boolean;
    returnTo?: string;
}

function getSpineStyle(book: Book): { background: string; isCustom: boolean; light: boolean } {
    if (book.spineColor) {
        return { background: book.spineColor, isCustom: true, light: isLightColor(book.spineColor) };
    }
    return { background: getBookColor(book.title), isCustom: false, light: false };
}

export default function BookSpine({ book, horizontal = false, returnTo }: Props) {
    const { background, isCustom, light } = getSpineStyle(book);
    const textColor = light ? 'text-stone-900/90' : 'text-amber-100/90';
    const textColorSub = light ? 'text-stone-900/50' : 'text-amber-100/50';

    if (horizontal) {
        return (
            <div
                className={`relative w-[260px] sm:w-[300px] min-h-[44px] sm:min-h-[50px] rounded-sm overflow-hidden shadow-md shadow-black/40 flex flex-row items-stretch ${!isCustom ? `bg-gradient-to-r ${background}` : ''}`}
                style={isCustom ? { backgroundColor: background } : undefined}
            >
                {/* Top edge (was left edge on vertical) */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/25 z-10" />
                {/* Bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10 z-10" />

                {/* Thumbnail on the left */}
                {book.coverImageUrl && (
                    <div className="ml-2 my-auto w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-sm overflow-hidden flex-shrink-0 z-10">
                        <img
                            src={book.coverImageUrl}
                            alt={book.title}
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                {/* Title & Author */}
                <div className="flex-1 flex items-center px-3 py-1.5 min-w-0 overflow-hidden">
                    <div
                        style={{
                            maxHeight: '100%',
                            columnWidth: '240px',
                            columnFill: 'auto',
                            columnGap: '8px',
                        }}
                    >
                        <p className={`${textColor} text-[10px] sm:text-xs font-medium leading-tight break-words`}>
                            {book.title}
                        </p>
                        <p className={`${textColorSub} text-[8px] sm:text-[9px] leading-tight break-words mt-0.5`}>
                            {book.author}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link href={`/books/${book.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="block group">
            <div className="group-hover:-translate-y-2 transition-transform duration-200 group-hover:shadow-lg group-hover:shadow-black/60">
                <div
                    className={`relative h-[220px] sm:h-[260px] min-w-[44px] sm:min-w-[50px] rounded-sm overflow-hidden shadow-md shadow-black/40 flex flex-col ${!isCustom ? `bg-gradient-to-b ${background}` : ''}`}
                    style={isCustom ? { backgroundColor: background } : undefined}
                >
                    {/* Spine left edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black/25 z-10" />
                    {/* Spine right edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/10 z-10" />

                    {/* Thumbnail pinned to top */}
                    {book.coverImageUrl && (
                        <div className="mx-auto mt-2 w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-sm overflow-hidden flex-shrink-0 z-10">
                            <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {/* Text area - fills remaining space, text flows from bottom */}
                    <div className="flex-1 flex items-end px-1 pb-2 pt-1 overflow-hidden">
                        <div
                            className="w-full"
                            style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)',
                                maxHeight: '100%',
                                columnFill: 'auto',
                                columnGap: '2px',
                            }}
                        >
                            <p className={`${textColor} text-[10px] sm:text-xs font-medium leading-tight break-words`}>
                                {book.title}
                            </p>
                            <p className={`${textColorSub} text-[8px] sm:text-[9px] leading-tight break-words mt-1`}>
                                {book.author}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
