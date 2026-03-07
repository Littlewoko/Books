"use client";

import { Card, CardContent, Typography } from "@mui/material";

interface MonthlyChartProps {
    data: any[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
        const monthNum = index + 1;
        const found = data.find(d => Number(d.month) === monthNum);
        return {
            month,
            count: found ? Number(found.count) : 0,
        };
    });

    const maxCount = Math.max(...monthlyData.map(d => d.count), 1);

    return (
        <Card sx={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <CardContent className="p-4">
                <Typography className="text-gray-300 mb-4" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Books Read in {currentYear}
                </Typography>
                <div className="flex items-end justify-between h-48 gap-1">
                    {monthlyData.map((item) => {
                        const height = (item.count / maxCount) * 100;
                        
                        return (
                            <div key={item.month} className="flex-1 flex flex-col items-center">
                                <div className="w-full flex items-end justify-center h-40">
                                    {item.count > 0 && (
                                        <div 
                                            className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t transition-all relative group"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Typography className="text-gray-300 text-xs whitespace-nowrap">
                                                    {item.count}
                                                </Typography>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Typography className="text-gray-400 mt-2" sx={{ fontSize: '10px' }}>
                                    {item.month}
                                </Typography>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
