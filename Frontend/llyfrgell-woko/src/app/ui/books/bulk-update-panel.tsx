"use client";

import { useState } from "react";
import { Typography, CircularProgress, LinearProgress } from "@mui/material";
import { getBooksWithMissingData, updateSingleBook, BulkUpdateResult, getBooksWithMissingSpineColor, updateSpineColor } from "@/app/lib/books/bulk-update";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

export default function BulkUpdatePanel() {
    const [previewBooks, setPreviewBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [results, setResults] = useState<BulkUpdateResult[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [currentBook, setCurrentBook] = useState<string>("");
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const [colorProgress, setColorProgress] = useState({ current: 0, total: 0 });
    const [colorUpdating, setColorUpdating] = useState(false);
    const [colorResults, setColorResults] = useState<{ title: string; success: boolean; color?: string; error?: string }[]>([]);

    const handlePreview = async () => {
        setLoading(true);
        try {
            const books = await getBooksWithMissingData();
            setPreviewBooks(books);
            setShowPreview(true);
        } catch (error) {
            console.error('Preview failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setUpdating(true);
        setShowPreview(false);
        setResults([]);
        setProgress({ current: 0, total: previewBooks.length });
        
        try {
            for (let i = 0; i < previewBooks.length; i++) {
                const book = previewBooks[i];
                setCurrentBook(book.title);
                setProgress({ current: i + 1, total: previewBooks.length });
                
                const result = await updateSingleBook(book, i + 1, previewBooks.length);
                setResults(prev => [...prev, result]);
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setUpdating(false);
            setCurrentBook("");
        }
    };

    const handleColorBackfill = async () => {
        setColorUpdating(true);
        setColorResults([]);
        try {
            const books = await getBooksWithMissingSpineColor();
            setColorProgress({ current: 0, total: books.length });

            for (let i = 0; i < books.length; i++) {
                const book = books[i];
                setColorProgress({ current: i + 1, total: books.length });
                const result = await updateSpineColor(book.id, book.coverimageurl);
                setColorResults(prev => [...prev, { title: book.title, ...result }]);
            }
        } catch (error) {
            console.error('Color backfill failed:', error);
        } finally {
            setColorUpdating(false);
        }
    };

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
        <div className="p-4 border border-gray-600 rounded bg-black/30">
            <Typography className="text-gray-300 mb-3" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
                Bulk Update Missing Book Data
            </Typography>

            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loading || updating}
                    className="flex items-center text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:bg-gradient-to-l disabled:opacity-50 font-small rounded-lg text-sm p-2 px-4"
                >
                    {loading ? <CircularProgress size={16} className="text-white mr-2" /> : <InfoIcon className="mr-2" fontSize="small" />}
                    Preview Updates
                </button>

                {showPreview && previewBooks.length > 0 && (
                    <button
                        type="button"
                        onClick={handleUpdate}
                        disabled={updating}
                        className="flex items-center text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:bg-gradient-to-l disabled:opacity-50 font-small rounded-lg text-sm p-2 px-4"
                    >
                        {updating ? <CircularProgress size={16} className="text-white mr-2" /> : <CheckCircleIcon className="mr-2" fontSize="small" />}
                        Apply Updates
                    </button>
                )}
            </div>

            {showPreview && previewBooks.length > 0 && (
                <div className="mb-4 p-3 border border-blue-500 rounded bg-blue-900/20">
                    <Typography className="text-blue-300 mb-2" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        {previewBooks.length} book(s) will be updated
                    </Typography>
                    <div className="max-h-60 overflow-y-auto">
                        {previewBooks.map((book) => (
                            <div key={book.id} className="text-gray-300 text-sm py-1">
                                • {book.title} by {book.author}
                                <span className="text-gray-500 ml-2">
                                    (Missing: {!book.coverimageurl && 'cover'}{!book.coverimageurl && (!book.description || !book.isbn) && ', '}
                                    {!book.description && 'description'}{!book.description && !book.isbn && ', '}
                                    {!book.isbn && 'ISBN'})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showPreview && previewBooks.length === 0 && !loading && (
                <div className="p-3 border border-green-500 rounded bg-green-900/20">
                    <Typography className="text-green-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        All books have complete data!
                    </Typography>
                </div>
            )}

            {updating && (
                <div className="mb-4 p-3 border border-yellow-500 rounded bg-yellow-900/20">
                    <Typography className="text-yellow-300 mb-2" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                        Updating books... ({progress.current} of {progress.total})
                    </Typography>
                    <LinearProgress variant="determinate" value={progressPercent} className="mb-2" />
                    <Typography className="text-yellow-200 text-sm">
                        Current: {currentBook}
                    </Typography>
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-4">
                    {!updating && (
                        <div className="mb-3 p-3 border border-gray-500 rounded bg-gray-900/20">
                            <Typography className="text-gray-300 mb-2" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
                                {updating ? 'Progress' : 'Update Complete'}
                            </Typography>
                            <Typography className="text-green-400" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                ✓ {successCount} successful
                            </Typography>
                            {failCount > 0 && (
                                <Typography className="text-red-400" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                    ✗ {failCount} failed
                                </Typography>
                            )}
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto">
                        {results.map((result) => (
                            <div
                                key={result.bookId}
                                className={`p-2 mb-2 border rounded ${
                                    result.success ? 'border-green-600 bg-green-900/10' : 'border-red-600 bg-red-900/10'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    {result.success ? (
                                        <CheckCircleIcon className="text-green-400" fontSize="small" />
                                    ) : (
                                        <ErrorIcon className="text-red-400" fontSize="small" />
                                    )}
                                    <div className="flex-1">
                                        <Typography className="text-gray-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                            {result.title}
                                        </Typography>
                                        {result.success && result.fieldsUpdated.length > 0 && (
                                            <Typography className="text-gray-400" sx={{ fontSize: { xs: '10px', sm: '12px' } }}>
                                                Updated: {result.fieldsUpdated.join(', ')}
                                            </Typography>
                                        )}
                                        {result.error && (
                                            <Typography className="text-red-400" sx={{ fontSize: { xs: '10px', sm: '12px' } }}>
                                                {result.error}
                                            </Typography>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spine Color Backfill */}
            <div className="mt-6 pt-4 border-t border-gray-600">
                <Typography className="text-gray-300 mb-3" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
                    Backfill Spine Colours
                </Typography>
                <button
                    type="button"
                    onClick={handleColorBackfill}
                    disabled={colorUpdating}
                    className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l disabled:opacity-50 font-small rounded-lg text-sm p-2 px-4"
                >
                    {colorUpdating ? <CircularProgress size={16} className="text-white mr-2" /> : null}
                    {colorUpdating ? `Processing ${colorProgress.current}/${colorProgress.total}` : 'Extract Colours from Covers'}
                </button>

                {colorResults.length > 0 && !colorUpdating && (
                    <div className="mt-3 p-3 border border-gray-500 rounded bg-gray-900/20">
                        <Typography className="text-green-400" sx={{ fontSize: '14px' }}>
                            ✓ {colorResults.filter(r => r.success).length} colours extracted
                        </Typography>
                        {colorResults.filter(r => !r.success).length > 0 && (
                            <Typography className="text-red-400" sx={{ fontSize: '14px' }}>
                                ✗ {colorResults.filter(r => !r.success).length} failed
                            </Typography>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
