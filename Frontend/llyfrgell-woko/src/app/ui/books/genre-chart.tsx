"use client";

import { Card, CardContent, Typography } from "@mui/material";

interface GenreChartProps {
    data: any[];
}

export default function GenreChart({ data }: GenreChartProps) {
    const total = data.reduce((sum, item) => sum + Number(item.count), 0);
    const colors = [
        'from-red-500 to-orange-500',
        'from-orange-500 to-yellow-500',
        'from-yellow-500 to-green-500',
        'from-green-500 to-teal-500',
        'from-teal-500 to-blue-500',
        'from-blue-500 to-indigo-500',
        'from-indigo-500 to-purple-500',
        'from-purple-500 to-pink-500',
        'from-pink-500 to-red-500',
        'from-gray-500 to-gray-600',
    ];

    return (
        <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent className="p-4">
                <Typography className="text-gray-300 mb-4" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Top Genres
                </Typography>
                <div className="space-y-3">
                    {data.map((item, index) => {
                        const percentage = (Number(item.count) / total) * 100;
                        
                        return (
                            <div key={item.genre}>
                                <div className="flex justify-between mb-1">
                                    <Typography className="text-gray-400" sx={{ fontSize: '13px' }}>
                                        {item.genre}
                                    </Typography>
                                    <Typography className="text-gray-300" sx={{ fontSize: '13px' }}>
                                        {item.count} ({percentage.toFixed(0)}%)
                                    </Typography>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        className={`bg-gradient-to-r ${colors[index % colors.length]} h-2 rounded-full transition-all`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                {data.length === 0 && (
                    <Typography className="text-gray-500 text-center py-8" sx={{ fontSize: '14px' }}>
                        No genre data available
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
