import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getReadingStats } from "@/app/lib/books/stats";
import StatsOverview from "@/app/ui/books/stats-overview";
import YearlyChart from "@/app/ui/books/yearly-chart";
import GenreChart from "@/app/ui/books/genre-chart";
import TopRatedBooks from "@/app/ui/books/top-rated-books";
import MonthlyBooks from "@/app/ui/books/monthly-books";

export default async function StatsPage() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const stats = await getReadingStats();

    return (
        <main className="p-4">
            <div className="max-w-5xl mx-auto mt-2">
                <h1
                    className="text-amber-200/90 text-2xl sm:text-3xl mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                >
                    Reading Statistics
                </h1>

                <StatsOverview stats={stats.overall} avgRating={stats.avgRating} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <GenreChart data={stats.genres} />
                    <TopRatedBooks books={stats.topRated} />
                </div>

                <div className="mt-4">
                    <YearlyChart data={stats.byYear} />
                </div>

                <div className="mt-4">
                    <MonthlyBooks data={stats.byMonth} />
                </div>
            </div>
        </main>
    );
}
