import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Book } from '@/app/lib/classes/book';
import formatDate from '@/app/utils/formatDate';

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
        <Card className="h-fit" sx={{ minWidth: 275, display: 'flex', flexWrap: 'nowrap', backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent>
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
                    {book.genre}{book.considerTowardsTotalBooksCompleted ? " - Short Story" : ""}
                </Typography>
            </CardContent>
            <CardContent className="ml-auto min-w-36">
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

                {DateComponent("Obtained:", book.dateObtained)}
                {DateComponent("Began:", book.dateObtained)}
                {DateComponent("Completed:", book.dateObtained)}
            </CardContent>
        </Card>
    );
}