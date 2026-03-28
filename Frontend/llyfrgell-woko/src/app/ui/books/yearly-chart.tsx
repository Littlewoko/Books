"use client";

interface YearlyChartProps {
    data: any[];
}

export default function YearlyChart({ data }: YearlyChartProps) {
    const maxCount = Math.max(...data.map(d => Number(d.books) + Number(d.short_stories)));

    return (
        <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4">
            <h2
                className="text-amber-200/80 text-lg mb-4"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Books Read by Year
            </h2>
            <div className="space-y-3">
                {data.map((item) => {
                    const total = Number(item.books) + Number(item.short_stories);
                    const percentage = (total / maxCount) * 100;

                    return (
                        <div key={item.year}>
                            <div className="flex justify-between mb-1">
                                <span className="text-stone-400 text-[13px]">{item.year}</span>
                                <span className="text-stone-300 text-[13px]">
                                    {item.books} books {item.short_stories > 0 && `+ ${item.short_stories} stories`}
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
                <p className="text-stone-500 text-center py-8 text-sm">No completed books yet</p>
            )}
        </div>
    );
}
