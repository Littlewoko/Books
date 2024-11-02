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
                    className='text-gray-300 flex justify-between w-40'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <div>In Progress:</div><div> {stats?.inProgress || 0}</div>
                </Typography>
                <Typography
                    className='text-gray-300 flex justify-between w-40'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <div> Read This Year:</div><div>  {stats?.thisYearComplete || 0}</div>
                </Typography>
                <Typography
                    className='text-gray-300 flex justify-between w-40'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <div>  Shorts Read This Year: </div><div>  {stats?.thisYearCompleteShort || 0}</div>
                </Typography>
                <Typography
                    className='text-gray-300 flex justify-between w-40'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <div> All Time Read:</div><div>  {stats?.allTimeComplete || 0}</div>
                </Typography>
                <Typography
                    className='text-gray-300 flex justify-between w-40'
                    sx={{
                        mb: 1.5,
                        fontSize: { xs: '12px', sm: '14px' }
                    }}>
                    <div>All Time Shorts Read:</div><div>  {stats?.allTimeCompleteShort || 0}</div>
                </Typography>
            </CardContent>
        </Card>
    )
}