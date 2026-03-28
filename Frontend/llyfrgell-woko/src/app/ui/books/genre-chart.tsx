"use client";

interface GenreChartProps {
    data: any[];
}

export default function GenreChart({ data }: GenreChartProps) {
    const total = data.reduce((sum, item) => sum + Number(item.count), 0);

    return (
        <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4">
            <h2
                className="text-amber-200/80 text-lg mb-4"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Top Genres
            </h2>
            <div className="space-y-3">
                {data.map((item) => {
                    const percentage = (Number(item.count) / total) * 100;

                    return (
                        <div key={item.genre}>
                            <div className="flex justify-between mb-1">
                                <span className="text-stone-400 text-[13px]">{item.genre}</span>
                                <span className="text-stone-300 text-[13px]">
                                    {item.count} ({percentage.toFixed(0)}%)
                                </span>
                            </div>
                            <div className="w-full bg-stone-800 rounded-full h-2">
                                <div
                                    className="bg-amber-700 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {data.length === 0 && (
                <p className="text-stone-500 text-center py-8 text-sm">No genre data available</p>
            )}
        </div>
    );
}
