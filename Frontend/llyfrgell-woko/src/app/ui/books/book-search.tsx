"use client";

import { useState, useEffect, useRef } from "react";
import { Typography, CircularProgress } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { BookSearchResult } from "@/app/lib/books/api-service";

interface BookSearchProps {
    open: boolean;
    onClose: () => void;
    onSelectBook: (book: BookSearchResult) => void;
    currentData?: {
        title?: string;
        author?: string;
        genre?: string;
        isbn?: string;
        description?: string;
        coverImageUrl?: string;
    };
    initialQuery?: { title?: string; author?: string; isbn?: string };
}

const lineH = '28px';
const caveat = { fontFamily: 'var(--font-caveat)', fontSize: '18px', lineHeight: lineH };
const caveatSm = { fontFamily: 'var(--font-caveat)', fontSize: '16px', lineHeight: lineH };
const inputClass = "bg-transparent border-none text-stone-800 w-full focus:outline-none placeholder-stone-400 p-0 m-0";

export default function BookSearch({ open, onClose, onSelectBook, currentData, initialQuery }: BookSearchProps) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [isbn, setIsbn] = useState("");
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [overwriteFields, setOverwriteFields] = useState({
        title: false, author: false, genre: false, isbn: false, description: false, coverImageUrl: false,
    });
    const confirmRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && initialQuery) {
            setTitle(initialQuery.title || "");
            setAuthor(initialQuery.author || "");
            setIsbn(initialQuery.isbn || "");
            setResults([]);
            setHasSearched(false);
            setSelectedBook(null);
            setSelectedIndex(null);
            setShowConfirm(false);
        }
    }, [open, initialQuery]);

    useEffect(() => {
        if (showConfirm && confirmRef.current) {
            confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [showConfirm]);

    if (!open) return null;

    const handleSearch = async () => {
        if (!title.trim() && !author.trim() && !isbn.trim()) return;
        setLoading(true);
        setResults([]);
        setHasSearched(true);
        setSelectedBook(null);
        setSelectedIndex(null);
        setShowConfirm(false);
        try {
            const response = await fetch('/api/books/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim() || undefined,
                    author: author.trim() || undefined,
                    isbn: isbn.trim() || undefined,
                }),
            });
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const extractSpineColor = async (imageUrl: string | undefined): Promise<string | undefined> => {
        if (!imageUrl) return undefined;
        try {
            const res = await fetch('/api/books/extract-color', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl }),
            });
            const data = await res.json();
            return data.color || undefined;
        } catch {
            return undefined;
        }
    };

    const handleSelect = async (book: BookSearchResult, index: number) => {
        setSelectedBook(book);
        setSelectedIndex(index);

        const willOverwrite = (
            (currentData?.title && book.title !== currentData.title) ||
            (currentData?.author && book.author !== currentData.author) ||
            (currentData?.genre && book.genre && book.genre !== currentData.genre) ||
            ((currentData?.isbn && book.isbn && book.isbn !== currentData.isbn) || (!currentData?.isbn && book.isbn)) ||
            (currentData?.description && book.description) ||
            (currentData?.coverImageUrl && book.coverImageUrl)
        );

        if (willOverwrite) {
            setOverwriteFields({
                title: !!(currentData?.title && book.title !== currentData.title),
                author: !!(currentData?.author && book.author !== currentData.author),
                genre: !!(currentData?.genre && book.genre && book.genre !== currentData.genre),
                isbn: !!((currentData?.isbn && book.isbn && book.isbn !== currentData.isbn) || (!currentData?.isbn && book.isbn)),
                description: !!(currentData?.description && book.description),
                coverImageUrl: !!(currentData?.coverImageUrl && book.coverImageUrl),
            });
            setShowConfirm(true);
        } else {
            const spineColor = await extractSpineColor(book.coverImageUrl);
            onSelectBook({ ...book, spineColor });
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (!selectedBook) return;
        const spineColor = await extractSpineColor(
            overwriteFields.coverImageUrl ? selectedBook.coverImageUrl : currentData?.coverImageUrl || selectedBook.coverImageUrl
        );
        const modifiedBook: BookSearchResult = {
            title: overwriteFields.title ? selectedBook.title : currentData?.title || selectedBook.title,
            author: overwriteFields.author ? selectedBook.author : currentData?.author || selectedBook.author,
            genre: overwriteFields.genre ? selectedBook.genre : currentData?.genre || selectedBook.genre,
            isbn: overwriteFields.isbn ? selectedBook.isbn : (overwriteFields.title || overwriteFields.author ? undefined : currentData?.isbn),
            description: overwriteFields.description ? selectedBook.description : currentData?.description || selectedBook.description,
            coverImageUrl: overwriteFields.coverImageUrl ? selectedBook.coverImageUrl : currentData?.coverImageUrl || selectedBook.coverImageUrl,
            publishedDate: selectedBook.publishedDate,
            spineColor,
        };
        onSelectBook(modifiedBook);
        onClose();
    };

    const toggleAllFields = (checked: boolean) => {
        setOverwriteFields({
            title: checked && !!(currentData?.title && selectedBook?.title !== currentData.title),
            author: checked && !!(currentData?.author && selectedBook?.author !== currentData.author),
            genre: checked && !!(currentData?.genre && selectedBook?.genre && selectedBook.genre !== currentData.genre),
            isbn: checked && !!((currentData?.isbn && selectedBook?.isbn && selectedBook.isbn !== currentData.isbn) || (!currentData?.isbn && selectedBook?.isbn)),
            description: checked && !!(currentData?.description && selectedBook?.description),
            coverImageUrl: checked && !!(currentData?.coverImageUrl && selectedBook?.coverImageUrl),
        });
    };

    const renderConfirm = () => {
        if (!showConfirm || !selectedBook) return null;
        return (
            <div ref={confirmRef} className="border-t border-rose-400/30">
                <div style={{ height: lineH }} className="flex items-center">
                    <Typography className="text-amber-700" sx={caveat}>
                        Overwrite fields:
                    </Typography>
                </div>
                <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                    <input type="checkbox" checked={Object.values(overwriteFields).every(v => v)}
                        onChange={(e) => toggleAllFields(e.target.checked)} className="accent-amber-700 cursor-pointer" />
                    <Typography className="text-stone-700 font-bold" sx={caveatSm}>Select All</Typography>
                </label>
                {currentData?.title && selectedBook.title !== currentData.title && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.title}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, title: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600 truncate" sx={caveatSm}>
                            <span className="text-rose-500">Title:</span> {currentData.title} → {selectedBook.title}
                        </Typography>
                    </label>
                )}
                {currentData?.author && selectedBook.author !== currentData.author && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.author}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, author: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600 truncate" sx={caveatSm}>
                            <span className="text-rose-500">Author:</span> {currentData.author} → {selectedBook.author}
                        </Typography>
                    </label>
                )}
                {currentData?.genre && selectedBook.genre && selectedBook.genre !== currentData.genre && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.genre}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, genre: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600 truncate" sx={caveatSm}>
                            <span className="text-rose-500">Genre:</span> {currentData.genre} → {selectedBook.genre}
                        </Typography>
                    </label>
                )}
                {((currentData?.isbn && selectedBook.isbn && selectedBook.isbn !== currentData.isbn) || (!currentData?.isbn && selectedBook.isbn)) && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.isbn}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, isbn: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600 truncate" sx={caveatSm}>
                            <span className="text-rose-500">ISBN:</span> {currentData?.isbn ? `${currentData.isbn} → ${selectedBook.isbn}` : `Add ${selectedBook.isbn}`}
                        </Typography>
                    </label>
                )}
                {currentData?.description && selectedBook.description && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.description}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, description: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600" sx={caveatSm}>
                            <span className="text-rose-500">Description:</span> Will be replaced
                        </Typography>
                    </label>
                )}
                {currentData?.coverImageUrl && selectedBook.coverImageUrl && (
                    <label className="flex items-center gap-2 cursor-pointer" style={{ height: lineH }}>
                        <input type="checkbox" checked={overwriteFields.coverImageUrl}
                            onChange={(e) => setOverwriteFields(prev => ({ ...prev, coverImageUrl: e.target.checked }))} className="accent-amber-700 cursor-pointer" />
                        <Typography className="text-stone-600" sx={caveatSm}>
                            <span className="text-rose-500">Cover:</span> Will be replaced
                        </Typography>
                    </label>
                )}
                <div className="flex justify-center gap-4" style={{ height: lineH }}>
                    <button type="button" onClick={handleConfirm}
                        className="text-stone-600 hover:text-stone-800 transition-colors" style={caveat}>
                        Apply
                    </button>
                    <button type="button" onClick={() => { setShowConfirm(false); setSelectedBook(null); setSelectedIndex(null); }}
                        className="text-stone-400 hover:text-stone-600 transition-colors" style={caveat}>
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60" />

            <div
                className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-sm shadow-xl shadow-black/50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-[3px] bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40" />

                <div
                    className="relative pl-12 sm:pl-16 pr-5 sm:pr-8 overflow-y-auto flex-1"
                    style={{
                        backgroundColor: '#f5f0e1',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c9b99a40 27px, #c9b99a40 28px)',
                        paddingTop: '0px',
                        paddingBottom: '0px',
                    }}
                >
                    <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-[1px] bg-rose-400/50" />

                    {/* Header */}
                    <div className="flex justify-between items-center" style={{ height: lineH }}>
                        <Typography className="text-stone-400" sx={caveat}>Lookup:</Typography>
                        <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                            <CloseIcon sx={{ fontSize: '16px' }} />
                        </button>
                    </div>

                    {/* Search fields — each on its own line */}
                    <div style={{ height: lineH }}>
                        <input type="text" placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            className={inputClass} style={{ ...caveat, height: lineH }}
                        />
                    </div>
                    <div style={{ height: lineH }}>
                        <input type="text" placeholder="Author..." value={author} onChange={(e) => setAuthor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            className={inputClass} style={{ ...caveat, height: lineH }}
                        />
                    </div>
                    <div style={{ height: lineH }}>
                        <input type="text" placeholder="ISBN..." value={isbn} onChange={(e) => setIsbn(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            className={inputClass} style={{ ...caveat, height: lineH }}
                        />
                    </div>

                    {/* Search button */}
                    <div className="flex justify-center" style={{ height: lineH }}>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading || (!title.trim() && !author.trim() && !isbn.trim())}
                            className="flex items-center gap-1 text-stone-500 hover:text-stone-700 disabled:opacity-30 transition-colors"
                            style={caveat}
                        >
                            {loading ? <CircularProgress size={14} className="text-stone-500" /> : <SearchIcon sx={{ fontSize: '16px' }} />}
                            Search
                        </button>
                    </div>

                    {/* Results */}
                    {results.length > 0 && results.map((result, index) => (
                        <div key={index}>
                            <div
                                onClick={() => handleSelect(result, index)}
                                className={`flex gap-2 cursor-pointer transition-colors rounded-sm ${
                                    selectedIndex === index ? 'bg-amber-800/10' : 'hover:bg-amber-800/5'
                                }`}
                                style={{ minHeight: '56px' }}
                            >
                                {result.coverImageUrl && (
                                    <img src={result.coverImageUrl} alt={result.title}
                                        className="w-[40px] h-[56px] object-cover rounded-sm flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div style={{ height: lineH }} className="flex items-center">
                                        <Typography className="text-stone-800 truncate" sx={caveat}>
                                            {result.title}
                                        </Typography>
                                    </div>
                                    <div style={{ height: lineH }} className="flex items-center">
                                        <Typography className="text-stone-500 truncate" sx={caveatSm}>
                                            {result.author}
                                            {result.publishedDate && ` · ${result.publishedDate}`}
                                            {result.isbn && ` · ${result.isbn}`}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                            {/* Inline overwrite confirmation */}
                            {selectedIndex === index && renderConfirm()}
                        </div>
                    ))}

                    {results.length === 0 && !loading && hasSearched && (
                        <div style={{ height: lineH }} className="flex items-center justify-center">
                            <Typography className="text-stone-300" sx={caveat}>No results found</Typography>
                        </div>
                    )}

                    {/* Bottom padding — 3 blank lines */}
                    <div style={{ height: '84px' }} />
                </div>
            </div>
        </div>
    );
}
