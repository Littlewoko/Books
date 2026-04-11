import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getWorkoutForDateServer } from "@/app/lib/workouts/server-data";
import DayExerciseList from "@/app/ui/workouts/day-exercise-list";
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
    const data = await getWorkoutForDateServer(date);

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/workouts" className="text-black hover:text-amber-700 transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
                <h1
                    className="text-black text-xl sm:text-2xl font-bold"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                >
                    {displayDate}
                </h1>
            </div>

            <DayExerciseList
                date={date}
                workoutId={data?.workout.id ?? null}
                exercises={data?.exercises ?? []}
            />
        </main>
    );
}
