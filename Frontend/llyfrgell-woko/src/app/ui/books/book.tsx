import * as React from 'react';
import Box from '@mui/material/Box';
// import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Book } from '@/app/lib/classes/book';

interface Props {
    book: Book
}

export default function BookComponent({ book }: Props) {
    const status = () => {
        if (!!book.dateCompleted) {
            return "Completed"
        }

        if (!!book.dateStartedReading) {
            return "In Progress"
        }

        if (!!!book.dateObtained) {
            return "Not owned"
        }
    }

    return (
        <Box sx={{ minWidth: 275 }}>
            <div className="flex">
                <CardContent>
                    <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {book.author}
                    </Typography>
                    <Typography variant="h5" component="div">
                        {book.title}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 1.5, fontSize: 12 }}>
                        {book.genre}
                    </Typography>
                </CardContent>

                <CardContent>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                        Status: {status()}
                    </Typography>
                </CardContent>
            </div>

            <CardActions sx={{ mt: -2 }}>
                <Button size="small">See More</Button>
            </CardActions>
        </Box>
    );
}