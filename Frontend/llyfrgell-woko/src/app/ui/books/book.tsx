"use client";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Book } from '@/app/lib/classes/book';
import formatDate from '@/app/utils/formatDate';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DeleteBook } from '@/app/lib/books/actions';

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

    const Delete = async () => {
        console.log("here")
        const wantToDelete = confirm(`Are you sure you want to delete ${book.title}? This action cannot be undone`);
        if (!wantToDelete) return;

        await DeleteBook(book.id?.toString() ?? "", book.title);
    }

    return (
        <Card className="h-fit" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
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
                    {book.genre}{!book.considerTowardsTotalBooksCompleted ? " - Short Story" : ""}
                </Typography>
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

                <div className="flex justify-end mt-3 gap-2">
                    <Link href={`/books/${book.id}/edit`}>
                        <button type="button" className="flex items-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                            <EditIcon className="md:mr-1" fontSize="small" />
                            <span className="hidden md:inline">Edit</span>
                        </button>
                    </Link>

                    <button
                        onClick={Delete}
                        type="button"
                        className="flex items-center text-white bg-gradient-to-r from-red-500 to-red-700 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-red-200 dark:focus:ring-red-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm"
                    >
                        <DeleteIcon className="md:mr-1" fontSize="small" />
                        <span className="hidden md:inline">Delete</span>
                    </button>

                </div>
            </CardContent>
        </Card>
    );
}