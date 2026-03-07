import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getReadingStats } from "@/app/lib/books/stats";
import Header from "@/app/ui/books/header";
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
            <Header text="Reading Statistics" colour="text-cyan-500" />
            <div className="max-w-7xl mx-auto mt-4">
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
