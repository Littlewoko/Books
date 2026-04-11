import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getWorkoutForDate } from "@/app/lib/workouts/calendar-actions";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Props {
    params: Promise<{ date: string }>;
}

export default async function DayViewPage({ params }: Props) {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const { date } = await params;
    const data = await getWorkoutForDate(date);

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/workouts" className="text-amber-100/50 hover:text-amber-100 transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
                <h1
                    className="text-amber-200/90 text-xl sm:text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                >
                    {displayDate}
                </h1>
            </div>

            {!data || data.exercises.length === 0 ? (
                <p className="text-stone-500 text-sm">No exercises logged for this day.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {data.exercises.map((ex) => (
                        <Link
                            key={ex.id}
                            href={`/workouts/${date}/${ex.exerciseId}`}
                            className="block p-3 rounded border border-stone-700/40 bg-stone-900/60 hover:border-amber-700/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-amber-100/90 text-sm">{ex.exerciseName}</span>
                                    <span className="text-stone-500 text-xs ml-2">{ex.muscleGroupName}</span>
                                </div>
                                <span className="text-stone-500 text-xs">
                                    {ex.setCount} {ex.setCount === 1 ? 'set' : 'sets'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
