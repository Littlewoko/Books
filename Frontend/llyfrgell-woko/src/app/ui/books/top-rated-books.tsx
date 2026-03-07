import { Card, CardContent, Typography } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';

interface TopRatedBooksProps {
    books: any[];
}

export default function TopRatedBooks({ books }: TopRatedBooksProps) {
    return (
        <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent className="p-4">
                <Typography className="text-gray-300 mb-4" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Top Rated Books
                </Typography>
                <div className="space-y-3">
                    {books.map((book, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-1 min-w-[60px]">
                                <Typography className="text-yellow-400 font-bold" sx={{ fontSize: '18px' }}>
                                    {book.rating}
                                </Typography>
                                <StarIcon className="text-yellow-400" fontSize="small" />
                            </div>
                            <div className="flex-1">
                                <Typography className="text-orange-400" sx={{ fontSize: '14px' }}>
                                    {book.title}
                                </Typography>
                                <Typography className="text-gray-400" sx={{ fontSize: '12px' }}>
                                    {book.author}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
                {books.length === 0 && (
                    <Typography className="text-gray-500 text-center py-8" sx={{ fontSize: '14px' }}>
                        No rated books yet
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
