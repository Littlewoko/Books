import { Stats } from "@/app/lib/classes/stats";
import { Card, CardContent, Typography } from "@mui/material";

interface Props {
    stats: Stats | null
}

export default function StatsCard({ stats }: Props) {
    return (
        <Card className="p-2 pb-0 m-1" sx={{ minWidth: 275, backgroundColor: "rgba(0,0,0,0.5)" }}>
            <CardContent className="m-0 p-2 flex flex-col items-center">
                <Typography
                    component="div"
                    className='text-white flex justify-between w-48'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <span>In Progress:</span><span> {stats?.inProgress || 0}</span>
                </Typography>
                <Typography
                    component="div"
                    className='text-white flex justify-between w-48'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <span>Read This Year:</span><span> {stats?.thisYearComplete || 0}</span>
                </Typography>
                <Typography
                    component="div"
                    className='text-white flex justify-between w-48'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <span>Shorts Read This Year:</span><span> {stats?.thisYearCompleteShort || 0}</span>
                </Typography>
                <Typography
                    component="div"
                    className='text-white flex justify-between w-48'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <span>All Time Read:</span><span> {stats?.allTimeComplete || 0}</span>
                </Typography>
                <Typography
                    component="div"
                    className='text-white flex justify-between w-48'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <span>All Time Shorts Read:</span><span> {stats?.allTimeCompleteShort || 0}</span>
                </Typography>
            </CardContent>
        </Card>
    )
}