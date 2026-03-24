"use client";

import { createBook } from "@/app/lib/books/actions";
import { Typography } from "@mui/material";
import { useState, useRef, useEffect, useCallback } from "react";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StarRating from "./star-rating";
import BookSearch from "./book-search";
import { BookSearchResult } from "@/app/lib/books/api-service";
import { getBookColor, isLightColor } from "@/app/utils/bookColors";

export default function Form() {
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [isbn, setIsbn] = useState("");
    const [description, setDescription] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [spineColor, setSpineColor] = useState("");

    const handleSelectBook = (book: BookSearchResult) => {
        setTitle(book.title);
        setAuthor(book.author);
        setGenre(book.genre || "");
        setIsbn(book.isbn || "");
        setDescription(book.description || "");
        setCoverImageUrl(book.coverImageUrl || "");
        setSpineColor(book.spineColor || "");
    };

    const hasCustomColor = !!spineColor;
    const fallbackColor = getBookColor(title || "New Book");
    const light = hasCustomColor && isLightColor(spineColor);
    const coverText = light ? 'text-stone-900/90' : 'text-amber-100/95';
    const coverTextSub = light ? 'text-stone-900/60' : 'text-amber-100/60';
    const coverTextMuted = light ? 'text-stone-900/40' : 'text-amber-100/40';
    const coverBorder = light ? 'border-stone-900/15' : 'border-amber-100/15';
    const coverInputBg = light ? 'bg-stone-900/5' : 'bg-white/5';
    const coverInputBorder = light ? 'border-stone-900/20' : 'border-amber-100/20';
    const coverInputPlaceholder = light ? 'placeholder-stone-900/30' : 'placeholder-amber-100/30';

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const resizeTitle = useCallback(() => {
        const el = titleRef.current;
        if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
    }, []);
    useEffect(resizeTitle, [title, resizeTitle]);

    return (
        <form action={createBook} className="max-w-2xl mx-auto px-2">
            {/* Book Cover Section */}
            <div
                className={`relative rounded-sm overflow-hidden shadow-xl shadow-black/50 ${!hasCustomColor ? `bg-gradient-to-b ${fallbackColor}` : ''}`}
                style={hasCustomColor ? { backgroundColor: spineColor } : undefined}
            >
                {/* Spine edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-black/30 z-10" />

                <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col items-center text-center">
                    {coverImageUrl && (
                        <div className="mb-6 shadow-lg shadow-black/40 rounded overflow-hidden">
                            <img src={coverImageUrl} alt="Book cover" className="w-40 sm:w-52 object-contain" />
                        </div>
                    )}

                    {/* Title */}
                    <textarea
                        ref={titleRef}
                        id="title"
                        name="title"
                        maxLength={255}
                        placeholder="Title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        rows={1}
                        className={`${coverText} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-full mb-2 pb-1 focus:outline-none resize-none overflow-hidden`}
                        style={{ fontSize: '22px', fontFamily: 'Georgia, serif', fontWeight: 600, lineHeight: 1.2 }}
                    />

                    {/* Author */}
                    <input
                        id="author"
                        name="author"
                        maxLength={255}
                        placeholder="Author"
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className={`${coverTextSub} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-full mb-4 pb-1 focus:outline-none`}
                        style={{ fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    />

                    {/* Genre */}
                    <input
                        id="genre"
                        name="genre"
                        maxLength={255}
                        placeholder="Genre"
                        required
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className={`${coverTextMuted} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-48 mb-2 pb-1 focus:outline-none`}
                        style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    />

                    {/* ISBN */}
                    <input
                        id="isbn"
                        name="isbn"
                        maxLength={255}
                        placeholder="ISBN"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        className={`${coverTextMuted} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-40 pb-1 focus:outline-none`}
                        style={{ fontSize: '10px' }}
                    />
                </div>

                {/* Description */}
                <div className="px-6 sm:px-10 pb-8 sm:pb-12">
                    <div className={`border-t ${coverBorder} pt-5`}>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            maxLength={2000}
                            placeholder="Book description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${coverTextSub} ${coverInputPlaceholder} ${coverInputBg} rounded w-full p-2 focus:outline-none resize-none`}
                            style={{ fontSize: '13px', lineHeight: 1.7, fontFamily: 'Georgia, serif' }}
                        />
                    </div>
                </div>
            </div>

            {/* Notebook Section */}
            <div className="mt-6 rounded-sm overflow-hidden shadow-lg shadow-black/30">
                <div className="h-[3px] bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40" />

                <div
                    className="relative pl-12 sm:pl-16 pr-5 sm:pr-8"
                    style={{
                        backgroundColor: '#f5f0e1',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c9b99a40 27px, #c9b99a40 28px)',
                        paddingTop: '8px',
                        paddingBottom: '24px',
                    }}
                >
                    {/* Red margin line */}
                    <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                    {/* Short Story */}
                    <div className="flex items-center gap-2" style={{ height: '28px' }}>
                        <input type="checkbox" id="shortStory" name="shortStory" className="accent-amber-700" />
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Short story
                        </Typography>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3" style={{ height: '28px' }}>
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Rating:
                        </Typography>
                        <StarRating rating={rating} interactive onChange={setRating} handwritten />
                        <input type="hidden" name="rating" value={rating} />
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-x-6">
                        {[
                            { id: 'dateobtained', label: 'Obtained' },
                            { id: 'datestartedreading', label: 'Began' },
                            { id: 'datecompleted', label: 'Completed' },
                        ].map(({ id, label }) => (
                            <div key={id} style={{ height: '28px' }} className="flex items-center gap-1">
                                <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                    {label}:
                                </Typography>
                                <input
                                    type="date"
                                    id={id}
                                    name={id}
                                    className="bg-transparent border-none text-stone-700 focus:outline-none"
                                    style={{ fontSize: '16px', fontFamily: 'var(--font-caveat)', lineHeight: '28px' }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Review */}
                    <div style={{ marginTop: '28px' }}>
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Review:
                        </Typography>
                        <textarea
                            id="review"
                            name="review"
                            rows={4}
                            maxLength={2000}
                            placeholder="Write your review..."
                            className="w-full bg-transparent border-none text-stone-800 placeholder-stone-300 focus:outline-none resize-none"
                            style={{
                                fontSize: '18px',
                                lineHeight: '28px',
                                fontFamily: 'var(--font-caveat)',
                            }}
                        />
                    </div>

                    <div style={{ height: '84px' }} />
                </div>
            </div>

            {/* Actions - subtle, below the notebook */}
            <div className="mt-8 mb-6 flex justify-center">
                <button type="submit" className="flex items-center text-stone-600 hover:text-stone-300 transition-colors text-sm gap-1">
                    <AddCircleIcon sx={{ fontSize: '14px' }} />
                    Add to Library
                </button>
            </div>

            <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
            <input type="hidden" name="spineColor" value={spineColor} />

            <BookSearch
                onSelectBook={handleSelectBook}
                currentData={{ title, author, genre, isbn, description, coverImageUrl }}
            />
        </form>
    );
}
