"use client";

import { useState } from "react";
import { Typography, CircularProgress } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { BookSearchResult } from "@/app/lib/books/api-service";

interface BookSearchProps {
    onSelectBook: (book: BookSearchResult) => void;
    currentData?: {
        title?: string;
        author?: string;
        genre?: string;
        isbn?: string;
        description?: string;
        coverImageUrl?: string;
    };
}

export default function BookSearch({ onSelectBook, currentData }: BookSearchProps) {
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
        title: false,
        author: false,
        genre: false,
        isbn: false,
        description: false,
        coverImageUrl: false,
    });

    const handleSearch = async () => {
        if (!title.trim() && !author.trim() && !isbn.trim()) return;

        setLoading(true);
        setResults([]);
        setHasSearched(true);
        setSelectedIndex(null);

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

    const handleSelect = async (index: number) => {
        const book = results[index];
        setSelectedIndex(index);
        setSelectedBook(book);
        
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
            setShowConfirm(false);
        }
    };

    const handleConfirm = async () => {
        if (selectedBook) {
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
        }
        setShowConfirm(false);
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

    const handleCancel = () => {
        setShowConfirm(false);
        setSelectedIndex(null);
        setSelectedBook(null);
    };

    const inputClass = "placeholder-gray-400/60 border border-indigo-400/20 bg-indigo-950/20 text-sm block w-full p-1.5 text-gray-300 rounded focus:border-indigo-400/50 focus:outline-none transition-colors";

    return (
        <div className="mt-3 mb-6 rounded-lg p-4 border border-indigo-500/10" style={{ backgroundColor: "rgba(15,10,40,0.75)" }}>
            <Typography className="text-indigo-300/60 mb-3" sx={{ fontSize: { xs: '11px', sm: '12px' }, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Lookup Book Data
            </Typography>
            
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className={`flex-1 ${inputClass}`}
                />
                <input
                    type="text"
                    placeholder="Author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className={`flex-1 ${inputClass}`}
                />
                <input
                    type="text"
                    placeholder="ISBN"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className={`flex-1 ${inputClass}`}
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading || (!title.trim() && !author.trim() && !isbn.trim())}
                    className="flex items-center justify-center text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:bg-gradient-to-l disabled:opacity-30 rounded-lg text-sm p-1.5 px-4 w-full sm:w-auto transition-opacity"
                >
                    {loading ? <CircularProgress size={16} className="text-white" /> : <SearchIcon fontSize="small" />}
                </button>
            </div>

            {results.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 max-h-80 overflow-y-auto">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(index)}
                            className={`flex gap-3 p-2.5 rounded cursor-pointer transition-colors ${
                                selectedIndex === index
                                    ? 'bg-indigo-500/15 border border-indigo-400/40'
                                    : 'bg-white/5 border border-transparent hover:bg-indigo-500/10'
                            }`}
                        >
                            {result.coverImageUrl && (
                                <img
                                    src={result.coverImageUrl}
                                    alt={result.title}
                                    className="w-10 h-14 object-cover rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <Typography className="text-orange-400 truncate" sx={{ fontSize: { xs: '12px', sm: '13px' } }}>
                                    {result.title}
                                </Typography>
                                <Typography className="text-gray-300" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>
                                    {result.author}
                                </Typography>
                                <Typography className="text-gray-500" sx={{ fontSize: { xs: '10px', sm: '11px' } }}>
                                    {result.publishedDate && `${result.publishedDate} • `}
                                    {result.isbn && `ISBN: ${result.isbn}`}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showConfirm && selectedBook && (
                <div className="mt-3 p-3 border border-orange-500/40 rounded-lg bg-orange-900/15">
                    <Typography className="text-orange-300 mb-2" sx={{ fontSize: { xs: '12px', sm: '13px' } }}>
                        ⚠️ Select fields to overwrite:
                    </Typography>
                    <div className="mb-3">
                        <label className="flex items-center gap-2 text-gray-300 text-sm mb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Object.values(overwriteFields).every(v => v)}
                                onChange={(e) => toggleAllFields(e.target.checked)}
                                className="cursor-pointer"
                            />
                            <span className="font-bold">Select All</span>
                        </label>
                        {currentData?.title && selectedBook.title !== currentData.title && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.title}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, title: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span><span className="text-red-400">Title:</span> {currentData.title} → {selectedBook.title}</span>
                            </label>
                        )}
                        {currentData?.author && selectedBook.author !== currentData.author && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.author}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, author: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span><span className="text-red-400">Author:</span> {currentData.author} → {selectedBook.author}</span>
                            </label>
                        )}
                        {currentData?.genre && selectedBook.genre && selectedBook.genre !== currentData.genre && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.genre}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, genre: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span><span className="text-red-400">Genre:</span> {currentData.genre} → {selectedBook.genre}</span>
                            </label>
                        )}
                        {((currentData?.isbn && selectedBook.isbn && selectedBook.isbn !== currentData.isbn) || (!currentData?.isbn && selectedBook.isbn)) && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.isbn}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, isbn: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span>
                                    <span className="text-red-400">ISBN:</span> 
                                    {currentData?.isbn ? `${currentData.isbn} → ${selectedBook.isbn}` : `Add ${selectedBook.isbn}`}
                                </span>
                            </label>
                        )}
                        {currentData?.description && selectedBook.description && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.description}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, description: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span><span className="text-red-400">Description:</span> Will be replaced</span>
                            </label>
                        )}
                        {currentData?.coverImageUrl && selectedBook.coverImageUrl && (
                            <label className="flex items-center gap-2 text-gray-300 text-sm mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overwriteFields.coverImageUrl}
                                    onChange={(e) => setOverwriteFields(prev => ({ ...prev, coverImageUrl: e.target.checked }))}
                                    className="cursor-pointer"
                                />
                                <span><span className="text-red-400">Cover Image:</span> Will be replaced</span>
                            </label>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex items-center text-white bg-gradient-to-r from-orange-500 to-red-500 hover:bg-gradient-to-l font-small rounded-lg text-sm p-1 px-3"
                        >
                            Apply Selected
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center text-gray-300 bg-white/10 hover:bg-white/20 font-small rounded-lg text-sm p-1 px-3 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {results.length === 0 && !loading && hasSearched && (
                <Typography className="text-indigo-300/40 text-center mt-3" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>
                    No results found
                </Typography>
            )}
        </div>
    );
}
