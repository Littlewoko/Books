"use client";

import { Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";

interface MonthlyBooksProps {
    data: any[];
}

export default function MonthlyBooks({ data }: MonthlyBooksProps) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();
    
    // Group books by month
    const booksByMonth = months.map((month, index) => {
        const monthNum = index + 1;
        const books = data.filter(book => Number(book.month) === monthNum);
        return {
            month,
            books,
        };
    }).filter(item => item.books.length > 0);

    return (
        <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent className="p-4">
                <Typography className="text-gray-300 mb-4" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Books Completed in {currentYear}
                </Typography>
                <div className="space-y-6">
                    {booksByMonth.map((item) => (
                        <div key={item.month}>
                            <Typography className="text-gray-400 mb-3" sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {item.month}
                            </Typography>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {item.books.map((book: any) => (
                                    <Link key={book.id} href={`/books/${book.id}/edit`}>
                                        <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                            {book.coverimageurl ? (
                                                <div className="mb-2">
                                                    <img 
                                                        src={book.coverimageurl} 
                                                        alt={book.title}
                                                        className="w-full h-32 object-cover rounded"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mb-2 w-full h-32 bg-gray-700 rounded flex items-center justify-center">
                                                    <Typography className="text-gray-500 text-center p-2" sx={{ fontSize: '10px' }}>
                                                        No Cover
                                                    </Typography>
                                                </div>
                                            )}
                                            <Typography className="text-orange-400 line-clamp-2" sx={{ fontSize: '11px' }}>
                                                {book.title}
                                            </Typography>
                                            <Typography className="text-gray-400 line-clamp-1" sx={{ fontSize: '10px' }}>
                                                {book.author}
                                            </Typography>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {booksByMonth.length === 0 && (
                    <Typography className="text-gray-500 text-center py-8" sx={{ fontSize: '14px' }}>
                        No books completed this year
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
