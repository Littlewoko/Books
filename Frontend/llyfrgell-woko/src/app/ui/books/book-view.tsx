"use client";

import { Book } from "@/app/lib/classes/book";
import { Card, CardContent, Typography } from "@mui/material";
import formatDate from "@/app/utils/formatDate";
import StarRating from "./star-rating";
import EditIcon from '@mui/icons-material/Edit';
import Link from "next/link";

interface Props {
    book: Book | undefined
}

export default function BookView({ book }: Props) {
    if (!book || !book.id) {
        return <div className="text-gray-300">No such book</div>;
    }

    const status = () => {
        if (!!book.dateCompleted) return { text: "Completed", color: "text-yellow-500" };
        if (!!book.dateStartedReading) return { text: "In Progress", color: "text-violet-500" };
        if (!!book.dateObtained) return { text: "Owned", color: "text-slate-400" };
        return { text: "Not Owned", color: "text-slate-400" };
    };

    const statusInfo = status();

    return (
        <div className="max-w-4xl mx-auto">
            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        {book.coverImageUrl && (
                            <div className="flex-shrink-0 mx-auto sm:mx-0">
                                <img src={book.coverImageUrl} alt={book.title} className="w-48 h-64 object-cover rounded shadow-lg" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <Typography className="text-gray-400" sx={{ fontSize: { xs: '12px', sm: '14px' }, mb: 1 }}>
                                {book.author}
                            </Typography>
                            <Typography variant="h4" className="text-orange-400 break-words mb-2" sx={{ fontSize: { xs: '20px', sm: '28px' }, wordBreak: 'break-word' }}>
                                {book.title}
                            </Typography>
                            <Typography className="text-gray-300 mb-3" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                {book.genre}{book.shortStory ? " - Short Story" : ""}
                            </Typography>
                            {book.isbn && (
                                <Typography className="text-gray-400 mb-3" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>
                                    ISBN: {book.isbn}
                                </Typography>
                            )}
                            {book.rating != null && book.rating > 0 && (
                                <div className="mb-4">
                                    <StarRating rating={book.rating} />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                    <Typography className="text-slate-400" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Status:</Typography>
                                    <Typography className={statusInfo.color} sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{statusInfo.text}</Typography>
                                </div>
                                {book.dateObtained && (
                                    <div>
                                        <Typography className="text-slate-400" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Obtained:</Typography>
                                        <Typography className="text-gray-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{formatDate(book.dateObtained.toISOString())}</Typography>
                                    </div>
                                )}
                                {book.dateStartedReading && (
                                    <div>
                                        <Typography className="text-slate-400" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Began:</Typography>
                                        <Typography className="text-gray-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{formatDate(book.dateStartedReading.toISOString())}</Typography>
                                    </div>
                                )}
                                {book.dateCompleted && (
                                    <div>
                                        <Typography className="text-slate-400" sx={{ fontSize: { xs: '11px', sm: '12px' } }}>Completed:</Typography>
                                        <Typography className="text-gray-300" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{formatDate(book.dateCompleted.toISOString())}</Typography>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {book.description && (
                        <div className="mb-6">
                            <Typography variant="h6" className="text-orange-400 mb-2" sx={{ fontSize: { xs: '16px', sm: '18px' } }}>
                                Description
                            </Typography>
                            <Typography className="text-gray-300 whitespace-pre-wrap" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                {book.description}
                            </Typography>
                        </div>
                    )}

                    {book.review && (
                        <div className="mb-6">
                            <Typography variant="h6" className="text-orange-400 mb-2" sx={{ fontSize: { xs: '16px', sm: '18px' } }}>
                                My Review
                            </Typography>
                            <Typography className="text-gray-300 whitespace-pre-wrap" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>
                                {book.review}
                            </Typography>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <Link href={`/books/${book.id}/edit`}>
                            <button className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l font-small rounded-lg text-sm p-2 px-4">
                                <EditIcon className="mr-1" fontSize="small" />
                                Edit Book
                            </button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
