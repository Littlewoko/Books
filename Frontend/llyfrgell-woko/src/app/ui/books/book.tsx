"use client";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Book } from '@/app/lib/classes/book';
import formatDate from '@/app/utils/formatDate';
import Link from 'next/link';
import StarRating from './star-rating';

interface Props {
    book: Book
}

export default function BookComponent({ book }: Props) {
    const status = () => {
        if (!!book.dateCompleted) {
            return (
                <Typography
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                    className="text-yellow-500"
                >
                    Completed
                </Typography>
            )
        }

        if (!!book.dateStartedReading) {
            return (
                <Typography
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                    className="text-violet-500"
                >
                    In Progress
                </Typography>
            )
        }

        if (!!book.dateObtained && !book.dateStartedReading) {
            return (
                <Typography
                    className="text-slate-400"
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                >
                    Owned
                </Typography>
            )
        }

        if (!!!book.dateObtained) {
            return (
                <Typography
                    className="text-slate-400"
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                >
                    Not Owned
                </Typography>
            )
        }
    }

    const DateComponent = (text: string, date: Date | null | undefined) => {
        if (!date) return <></>

        return (
            <div className="flex justify-between">
                <Typography
                    className='text-gray-300'
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                >
                    {text}

                </Typography>
                <Typography
                    className='text-gray-300'
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}
                >
                    {formatDate(date.toISOString())}
                </Typography>
            </div>
        )
    }

    return (
        <Link href={`/books/${book.id}/edit`} className="block">
            <Card className="h-fit hover:bg-gray-800/50 transition-colors cursor-pointer" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
            {book.coverImageUrl && (
                <div className="flex-shrink-0 w-24 h-32 p-2">
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover rounded" />
                </div>
            )}
            <CardContent className="p-3">
                <Typography
                    gutterBottom
                    className='text-gray-300'
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}>
                    {book.author}
                </Typography>
                <Typography
                    gutterBottom
                    className='text-gray-300'
                    sx={{
                        fontSize: { xs: '10px', sm: '13px' }
                    }}>
                </Typography>
                <Typography
                    variant="h5"
                    component="div"
                    className="text-orange-400"
                    sx={{
                        fontSize: { xs: '16px', sm: 'h5.fontSize' }
                    }}>
                    {book.title}
                </Typography>
                <Typography
                    className='text-gray-300'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '10px', sm: '12px' }
                    }}>
                    {book.genre}{book.shortStory ? " - Short Story" : ""}
                </Typography>
                {book.rating != null && book.rating > 0 && (
                    <StarRating rating={book.rating} />
                )}
            </CardContent>
            <CardContent className="ml-auto min-w-36 flex flex-col p-3">
                <div className="flex justify-between">
                    <Typography
                        className="text-slate-400"
                        sx={{
                            fontSize: { xs: '10px', sm: '13px' }
                        }}

                    >
                        Status:
                    </Typography>
                    {status()}
                </div>
                {DateComponent("Completed:", book.dateCompleted)}
                {DateComponent("Began:", book.dateStartedReading)}
                {DateComponent("Obtained:", book.dateObtained)}
            </CardContent>
        </Card>
        </Link>
    );
}