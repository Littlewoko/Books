"use client";

import { Card, CardContent, Typography } from "@mui/material";

interface YearlyChartProps {
    data: any[];
}

export default function YearlyChart({ data }: YearlyChartProps) {
    const maxCount = Math.max(...data.map(d => Number(d.books) + Number(d.short_stories)));

    return (
        <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent className="p-4">
                <Typography className="text-gray-300 mb-4" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Books Read by Year
                </Typography>
                <div className="space-y-3">
                    {data.map((item) => {
                        const total = Number(item.books) + Number(item.short_stories);
                        const percentage = (total / maxCount) * 100;
                        
                        return (
                            <div key={item.year}>
                                <div className="flex justify-between mb-1">
                                    <Typography className="text-gray-400" sx={{ fontSize: '13px' }}>
                                        {item.year}
                                    </Typography>
                                    <Typography className="text-gray-300" sx={{ fontSize: '13px' }}>
                                        {item.books} books {item.short_stories > 0 && `+ ${item.short_stories} stories`}
                                    </Typography>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                {data.length === 0 && (
                    <Typography className="text-gray-500 text-center py-8" sx={{ fontSize: '14px' }}>
                        No completed books yet
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
