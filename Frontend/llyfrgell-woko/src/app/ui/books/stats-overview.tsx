import { Card, CardContent, Typography } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';

interface StatsOverviewProps {
    stats: any;
    avgRating: number;
}

export default function StatsOverview({ stats, avgRating }: StatsOverviewProps) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        Total Completed
                    </Typography>
                    <Typography className="text-orange-400 font-bold" sx={{ fontSize: '24px' }}>
                        {stats.total_completed}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        {currentYear} Books
                    </Typography>
                    <Typography className="text-green-400 font-bold" sx={{ fontSize: '24px' }}>
                        {stats.completed_this_year}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        Short Stories
                    </Typography>
                    <Typography className="text-purple-400 font-bold" sx={{ fontSize: '24px' }}>
                        {stats.total_short_stories}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        In Progress
                    </Typography>
                    <Typography className="text-blue-400 font-bold" sx={{ fontSize: '24px' }}>
                        {stats.in_progress}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        Owned Unread
                    </Typography>
                    <Typography className="text-yellow-400 font-bold" sx={{ fontSize: '24px' }}>
                        {stats.owned_unread}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
                <CardContent className="p-3">
                    <Typography className="text-gray-400" sx={{ fontSize: '11px' }}>
                        Avg Rating
                    </Typography>
                    <div className="flex items-center gap-1">
                        <Typography className="text-yellow-400 font-bold" sx={{ fontSize: '24px' }}>
                            {avgRating ? Number(avgRating).toFixed(1) : 'N/A'}
                        </Typography>
                        {avgRating > 0 && <StarIcon className="text-yellow-400" fontSize="small" />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
