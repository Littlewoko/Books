"use client";

import { Book } from "@/app/lib/classes/book";
import { formatDateForDatePicker } from "@/app/utils/formatDate";
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { Typography } from "@mui/material";
import { UpdateBook, DeleteBook } from "@/app/lib/books/actions";
import { useState, useRef, useEffect, useCallback } from "react";
import StarRating from "./star-rating";
import BookSearch from "./book-search";
import { BookSearchResult } from "@/app/lib/books/api-service";
import { getBookColor, isLightColor } from "@/app/utils/bookColors";

interface Props {
    book: Book | undefined
}

const Form: React.FC<Props> = ({ book }) => {
    const [rating, setRating] = useState(book?.rating || 0);
    const [title, setTitle] = useState(book?.title || "");
    const [author, setAuthor] = useState(book?.author || "");
    const [genre, setGenre] = useState(book?.genre || "");
    const [isbn, setIsbn] = useState(book?.isbn || "");
    const [description, setDescription] = useState(book?.description || "");
    const [coverImageUrl, setCoverImageUrl] = useState(book?.coverImageUrl || "");
    const [spineColor, setSpineColor] = useState(book?.spineColor || "");
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState<{ title?: string; author?: string; isbn?: string }>({});

    if (!book || !book.id) {
        return <div className="text-gray-300">No such book</div>;
    }

    const handleSelectBook = (selectedBook: BookSearchResult) => {
        setTitle(selectedBook.title);
        setAuthor(selectedBook.author);
        setGenre(selectedBook.genre || "");
        setIsbn(selectedBook.isbn || "");
        setDescription(selectedBook.description || "");
        setCoverImageUrl(selectedBook.coverImageUrl || "");
        setSpineColor(selectedBook.spineColor || "");
    };

    const openSearch = (query: { title?: string; author?: string; isbn?: string }) => {
        setSearchQuery(query);
        setSearchOpen(true);
    };

    const handleDelete = async () => {
        if (!book.id) return;
        const wantToDelete = confirm(`Are you sure you want to delete ${book.title}? This action cannot be undone`);
        if (!wantToDelete) return;
        await DeleteBook(book.id.toString());
    };

    const hasCustomColor = !!spineColor;
    const fallbackColor = getBookColor(title || "Book");
    const light = hasCustomColor && isLightColor(spineColor);
    const coverText = light ? 'text-stone-900/90' : 'text-amber-100/95';
    const coverTextSub = light ? 'text-stone-900/60' : 'text-amber-100/60';
    const coverTextMuted = light ? 'text-stone-900/40' : 'text-amber-100/40';
    const coverBorder = light ? 'border-stone-900/15' : 'border-amber-100/15';
    const coverInputBg = light ? 'bg-stone-900/5' : 'bg-white/5';
    const coverInputBorder = light ? 'border-stone-900/20' : 'border-amber-100/20';
    const coverInputPlaceholder = light ? 'placeholder-stone-900/30' : 'placeholder-amber-100/30';
    const searchBtnClass = light ? 'text-stone-900/25 hover:text-stone-900/50' : 'text-amber-100/25 hover:text-amber-100/50';

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const resizeTitle = useCallback(() => {
        const el = titleRef.current;
        if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
    }, []);
    useEffect(resizeTitle, [title, resizeTitle]);

    const updateBookWithId = UpdateBook.bind(null, book.id.toString());

    return (
        <form action={updateBookWithId} className="max-w-2xl mx-auto px-2">
            {/* Book Cover Section */}
            <div
                className={`relative rounded-sm overflow-hidden shadow-xl shadow-black/50 ${!hasCustomColor ? `bg-gradient-to-b ${fallbackColor}` : ''}`}
                style={hasCustomColor ? { backgroundColor: spineColor } : undefined}
            >
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-black/30 z-10" />

                <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col items-center text-center">
                    {coverImageUrl && (
                        <div className="mb-6 shadow-lg shadow-black/40 rounded overflow-hidden">
                            <img src={coverImageUrl} alt="Book cover" className="w-40 sm:w-52 object-contain" />
                        </div>
                    )}

                    {/* Title + search */}
                    <div className="w-full flex items-start gap-1">
                        <textarea
                            ref={titleRef}
                            id="title" name="title" maxLength={255} placeholder="Title" required
                            value={title} onChange={(e) => setTitle(e.target.value)} rows={1}
                            className={`${coverText} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center flex-1 mb-2 pb-1 focus:outline-none resize-none overflow-hidden`}
                            style={{ fontSize: '22px', fontFamily: 'Georgia, serif', fontWeight: 600, lineHeight: 1.2 }}
                        />
                        <button type="button" onClick={() => openSearch({ title })} className={`${searchBtnClass} transition-colors mt-1 flex-shrink-0`}>
                            <SearchIcon sx={{ fontSize: '16px' }} />
                        </button>
                    </div>

                    {/* Author + search */}
                    <div className="w-full flex items-center gap-1">
                        <input
                            id="author" name="author" maxLength={255} placeholder="Author" required
                            value={author} onChange={(e) => setAuthor(e.target.value)}
                            className={`${coverTextSub} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center flex-1 mb-4 pb-1 focus:outline-none`}
                            style={{ fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                        />
                        <button type="button" onClick={() => openSearch({ author })} className={`${searchBtnClass} transition-colors mb-3 flex-shrink-0`}>
                            <SearchIcon sx={{ fontSize: '14px' }} />
                        </button>
                    </div>

                    {/* Genre */}
                    <input
                        id="genre" name="genre" maxLength={255} placeholder="Genre" required
                        value={genre} onChange={(e) => setGenre(e.target.value)}
                        className={`${coverTextMuted} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-48 mb-2 pb-1 focus:outline-none`}
                        style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    />

                    {/* ISBN + search */}
                    <div className="flex items-center gap-1">
                        <input
                            id="isbn" name="isbn" maxLength={255} placeholder="ISBN"
                            value={isbn} onChange={(e) => setIsbn(e.target.value)}
                            className={`${coverTextMuted} ${coverInputPlaceholder} bg-transparent border-b ${coverInputBorder} text-center w-40 pb-1 focus:outline-none`}
                            style={{ fontSize: '10px' }}
                        />
                        <button type="button" onClick={() => openSearch({ isbn })} className={`${searchBtnClass} transition-colors flex-shrink-0`}>
                            <SearchIcon sx={{ fontSize: '12px' }} />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 sm:px-10 pb-8 sm:pb-12">
                    <div className={`border-t ${coverBorder} pt-5`}>
                        <textarea
                            id="description" name="description" rows={3} maxLength={2000}
                            placeholder="Book description..." value={description}
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
                        paddingTop: '8px', paddingBottom: '24px',
                    }}
                >
                    <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                    <div className="flex items-center gap-2" style={{ height: '28px' }}>
                        <input type="checkbox" id="shortStory" name="shortStory" defaultChecked={book.shortStory} className="accent-amber-700" />
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Short story
                        </Typography>
                    </div>

                    <div className="flex items-center gap-3" style={{ height: '28px' }}>
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Rating:
                        </Typography>
                        <StarRating rating={rating} interactive onChange={setRating} handwritten />
                        <input type="hidden" name="rating" value={rating} />
                    </div>

                    <div className="flex flex-wrap gap-x-6">
                        {[
                            { id: 'dateobtained', label: 'Obtained', value: book.dateObtained ? formatDateForDatePicker(book.dateObtained) : "" },
                            { id: 'datestartedreading', label: 'Began', value: book.dateStartedReading ? formatDateForDatePicker(book.dateStartedReading) : "" },
                            { id: 'datecompleted', label: 'Completed', value: book.dateCompleted ? formatDateForDatePicker(book.dateCompleted) : "" },
                        ].map(({ id, label, value }) => (
                            <div key={id} style={{ height: '28px' }} className="flex items-center gap-1">
                                <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                                    {label}:
                                </Typography>
                                <input type="date" id={id} name={id} defaultValue={value}
                                    className="bg-transparent border-none text-stone-700 focus:outline-none"
                                    style={{ fontSize: '16px', fontFamily: 'var(--font-caveat)', lineHeight: '28px' }}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '28px' }}>
                        <Typography className="text-stone-400" sx={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}>
                            Review:
                        </Typography>
                        <textarea
                            id="review" name="review" rows={4} maxLength={2000} placeholder="Write your review..."
                            defaultValue={book.review || ""}
                            className="w-full bg-transparent border-none text-stone-800 placeholder-stone-300 focus:outline-none resize-none"
                            style={{ fontSize: '18px', lineHeight: '28px', fontFamily: 'var(--font-caveat)' }}
                        />
                    </div>

                    <div style={{ height: '84px' }} />
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8 mb-6 flex justify-center gap-6">
                <button type="submit" className="flex items-center text-stone-600 hover:text-stone-300 transition-colors text-sm gap-1">
                    <SaveIcon sx={{ fontSize: '14px' }} />
                    Save
                </button>
                <button type="button" onClick={handleDelete}
                    className="flex items-center text-rose-400/60 hover:text-rose-300 transition-colors text-sm gap-1">
                    <DeleteIcon sx={{ fontSize: '14px' }} />
                    Delete
                </button>
            </div>

            <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
            <input type="hidden" name="spineColor" value={spineColor} />

            <BookSearch
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                onSelectBook={handleSelectBook}
                initialQuery={searchQuery}
                currentData={{ title, author, genre, isbn, description, coverImageUrl }}
            />
        </form>
    );
}

export default Form;
