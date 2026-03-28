"use client";

import { Book } from "@/app/lib/classes/book";
import { Typography } from "@mui/material";
import formatDate from "@/app/utils/formatDate";
import StarRating from "./star-rating";
import EditIcon from '@mui/icons-material/Edit';
import Link from "next/link";
import { getBookColor, isLightColor } from "@/app/utils/bookColors";
import { BookClubNote } from "@/app/lib/classes/book-club-note";
import QuickComplete from "./quick-complete";

interface Props {
    book: Book | undefined;
    bookClubNotes?: BookClubNote[];
    returnTo?: string;
}

export default function BookView({ book, bookClubNotes = [], returnTo }: Props) {
    if (!book || !book.id) {
        return <div className="text-gray-300">No such book</div>;
    }

    const fallbackColor = getBookColor(book.title);
    const hasCustomColor = !!book.spineColor;
    const light = hasCustomColor && isLightColor(book.spineColor!);
    const coverText = light ? 'text-stone-900/90' : 'text-amber-100/95';
    const coverTextSub = light ? 'text-stone-900/60' : 'text-amber-100/60';
    const coverTextMuted = light ? 'text-stone-900/40' : 'text-amber-100/40';
    const coverTextFaint = light ? 'text-stone-900/25' : 'text-amber-100/25';
    const coverBorder = light ? 'border-stone-900/10' : 'border-amber-100/10';

    const status = () => {
        if (book.dateCompleted) return { text: "Completed", color: "text-amber-700" };
        if (book.dateStartedReading) return { text: "In Progress", color: "text-violet-700" };
        if (book.dateObtained) return { text: "Owned", color: "text-stone-500" };
        return { text: "Not Owned", color: "text-stone-400" };
    };

    const statusInfo = status();

    return (
        <div className="max-w-2xl mx-auto px-2">
            {/* Book Cover */}
            <div
                className={`relative rounded-sm overflow-hidden shadow-xl shadow-black/50 ${!hasCustomColor ? `bg-gradient-to-b ${fallbackColor}` : ''}`}
                style={hasCustomColor ? { backgroundColor: book.spineColor! } : undefined}
            >
                {/* Spine edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-black/30 z-10" />

                <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col items-center text-center">
                    {/* Cover image */}
                    {book.coverImageUrl && (
                        <div className="mb-6 shadow-lg shadow-black/40 rounded overflow-hidden">
                            <img
                                src={book.coverImageUrl}
                                alt={book.title}
                                className="w-40 sm:w-52 object-contain"
                            />
                        </div>
                    )}

                    {/* Title */}
                    <Typography
                        className={`${coverText} break-words mb-2`}
                        sx={{
                            fontSize: { xs: '22px', sm: '30px' },
                            fontWeight: 600,
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                            fontFamily: 'Georgia, serif',
                        }}
                    >
                        {book.title}
                    </Typography>

                    {/* Author */}
                    <Typography
                        className={`${coverTextSub} mb-4`}
                        sx={{
                            fontSize: { xs: '14px', sm: '18px' },
                            fontFamily: 'Georgia, serif',
                            fontStyle: 'italic',
                        }}
                    >
                        {book.author}
                    </Typography>

                    {/* Genre & Short Story */}
                    <Typography className={coverTextMuted} sx={{ fontSize: { xs: '11px', sm: '13px' }, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {book.genre}{book.shortStory ? " · Novella" : ""}
                    </Typography>

                    {/* ISBN */}
                    {book.isbn && (
                        <Typography className={`${coverTextFaint} mt-2`} sx={{ fontSize: { xs: '10px', sm: '11px' } }}>
                            ISBN {book.isbn}
                        </Typography>
                    )}
                </div>

                {/* Description - back of the book feel */}
                {book.description && (
                    <div className="px-6 sm:px-10 pb-8 sm:pb-12">
                        <div className={`border-t ${coverBorder} pt-5`}>
                            <Typography
                                className={`${coverTextSub} whitespace-pre-wrap`}
                                sx={{
                                    fontSize: { xs: '11px', sm: '13px' },
                                    lineHeight: 1.7,
                                    fontFamily: 'Georgia, serif',
                                }}
                            >
                                {book.description}
                            </Typography>
                        </div>
                    </div>
                )}
            </div>

            {/* Notes / Journal */}
            <div className="mt-6 rounded-sm overflow-hidden shadow-lg shadow-black/30">
                {/* Notebook header line */}
                <div className="h-[3px] bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40" />

                <div
                    className="relative pl-12 sm:pl-16 pr-5 sm:pr-8"
                    style={{
                        backgroundColor: '#f5f0e1',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c9b99a40 27px, #c9b99a40 28px)',
                        backgroundPosition: '0 0',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                    }}
                >
                    {/* Red margin line */}
                    <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                    {/* Rating & Status row */}
                    <div className="flex items-center gap-4" style={{ height: '28px' }}>
                        {book.rating != null && book.rating > 0 && (
                            <StarRating rating={book.rating} handwritten />
                        )}
                        <Typography className={statusInfo.color} sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            {statusInfo.text}
                        </Typography>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-x-6">
                        {book.dateObtained && (
                            <div style={{ height: '28px' }}>
                                <Typography className="text-stone-700" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                    <span className="text-stone-400">Obtained: </span>{formatDate(book.dateObtained.toISOString())}
                                </Typography>
                            </div>
                        )}
                        {book.dateStartedReading && (
                            <div style={{ height: '28px' }}>
                                <Typography className="text-stone-700" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                    <span className="text-stone-400">Began: </span>{formatDate(book.dateStartedReading.toISOString())}
                                </Typography>
                            </div>
                        )}
                        {book.dateCompleted && (
                            <div style={{ height: '28px' }}>
                                <Typography className="text-stone-700" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                    <span className="text-stone-400">Completed: </span>{formatDate(book.dateCompleted.toISOString())}
                                </Typography>
                            </div>
                        )}
                    </div>

                    {/* Review */}
                    {book.review && (
                        <div>
                            <Typography
                                component="span"
                                className="text-stone-400"
                                sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                            >
                                Review:{' '}
                            </Typography>
                            <Typography
                                component="span"
                                className="text-stone-800 whitespace-pre-wrap"
                                sx={{
                                    fontSize: '18px',
                                    lineHeight: '28px',
                                    fontFamily: 'var(--font-caveat)',
                                }}
                            >
                                {book.review}
                            </Typography>
                        </div>
                    )}

                    {/* Book Club Q&A */}
                    {bookClubNotes.length > 0 && (
                        <div style={{ marginTop: '28px' }}>
                            <Typography
                                className="text-stone-400"
                                sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                            >
                                Notes:
                            </Typography>
                            {bookClubNotes.map((note, i) => (
                                <div key={note.id || i}>
                                    <Typography
                                        className="text-indigo-800"
                                        sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                                    >
                                        Q: {note.question}
                                    </Typography>
                                    {note.answer && (
                                        <Typography
                                            className="text-stone-700 whitespace-pre-wrap"
                                            sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                                        >
                                            A: {note.answer}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Complete */}
                    {!book.dateCompleted && (
                        <div className="flex flex-col items-end">
                            <QuickComplete
                                bookId={book.id.toString()}
                                hasStartedReading={!!book.dateStartedReading}
                                returnTo={returnTo}
                            />
                        </div>
                    )}

                    {/* Bottom margin - blank lines */}
                    <div style={{ height: book.dateCompleted ? '84px' : '28px' }} />
                </div>
            </div>

            {/* Edit - subtle, at the bottom */}
            <div className="mt-8 mb-6 flex justify-center">
                <Link href={`/books/${book.id}/edit${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>
                    <button className="flex items-center text-stone-600 hover:text-stone-300 transition-colors text-sm gap-1">
                        <EditIcon sx={{ fontSize: '14px' }} />
                        Edit
                    </button>
                </Link>
            </div>
        </div>
    );
}
