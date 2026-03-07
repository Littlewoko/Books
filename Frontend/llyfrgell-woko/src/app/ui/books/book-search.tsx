"use client";

import { useState } from "react";
import { Typography, CircularProgress } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { BookSearchResult } from "@/app/lib/books/api-service";

interface BookSearchProps {
    onSelectBook: (book: BookSearchResult) => void;
}

export default function BookSearch({ onSelectBook }: BookSearchProps) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleSearch = async () => {
        if (!title.trim()) return;

        setLoading(true);
        setResults([]);
        setSelectedIndex(null);

        try {
            const response = await fetch('/api/books/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author: author.trim() || undefined }),
            });

            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onSelectBook(results[index]);
    };

    return (
        <div className="flex flex-col gap-2 mb-4 p-3 border border-gray-600 rounded bg-black/30">
            <Typography className="text-gray-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                Search for Book Data
            </Typography>
            
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 placeholder-gray-300/80 border border-white bg-inherit text-sm p-1 text-gray-300"
                />
                <input
                    type="text"
                    placeholder="Author (optional)"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="flex-1 placeholder-gray-300/80 border border-white bg-inherit text-sm p-1 text-gray-300"
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading || !title.trim()}
                    className="flex items-center text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:bg-gradient-to-l disabled:opacity-50 font-small rounded-lg text-sm p-1 px-3"
                >
                    {loading ? <CircularProgress size={16} className="text-white" /> : <SearchIcon fontSize="small" />}
                </button>
            </div>

            {results.length > 0 && (
                <div className="flex flex-col gap-1 mt-2 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(index)}
                            className={`flex gap-2 p-2 border cursor-pointer hover:bg-gray-800/50 ${
                                selectedIndex === index ? 'border-blue-500 bg-gray-800/50' : 'border-gray-600'
                            }`}
                        >
                            {result.coverImageUrl && (
                                <img
                                    src={result.coverImageUrl}
                                    alt={result.title}
                                    className="w-12 h-16 object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <Typography className="text-orange-400" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                    {result.title}
                                </Typography>
                                <Typography className="text-gray-300" sx={{ fontSize: { xs: '10px', sm: '12px' } }}>
                                    {result.author}
                                </Typography>
                                <Typography className="text-gray-400" sx={{ fontSize: { xs: '10px', sm: '11px' } }}>
                                    {result.publishedDate && `${result.publishedDate} • `}
                                    {result.isbn && `ISBN: ${result.isbn}`}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {results.length === 0 && !loading && title && (
                <Typography className="text-gray-400 text-center" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>
                    No results found
                </Typography>
            )}
        </div>
    );
}
