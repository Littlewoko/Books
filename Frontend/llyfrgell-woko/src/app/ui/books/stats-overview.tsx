interface StatsOverviewProps {
    stats: any;
    avgRating: number;
}

export default function StatsOverview({ stats, avgRating }: StatsOverviewProps) {
    const currentYear = new Date().getFullYear();

    const items = [
        { label: "Total Completed", value: stats.total_completed },
        { label: `${currentYear} Novels`, value: stats.completed_this_year },
        { label: "Novellas", value: stats.total_short_stories },
        { label: "In Progress", value: stats.in_progress },
        { label: "Owned Unread", value: stats.owned_unread },
        { label: "Avg Rating", value: avgRating ? `${Number(avgRating).toFixed(1)} ★` : "N/A" },
    ];

    return (
        <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-3">
                {items.map((item) => (
                    <div key={item.label}>
                        <p className="text-stone-400 text-[11px]">{item.label}</p>
                        <p className="text-amber-200/90 text-xl font-semibold">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
