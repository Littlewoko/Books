import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getMovementScreenData } from "@/app/lib/workouts/movement-actions";
import MovementScreen from "@/app/ui/workouts/movement-screen";
import WorkoutSidebar from "@/app/ui/workouts/workout-sidebar";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Props {
    params: Promise<{ date: string; exerciseId: string }>;
}

export default async function MovementPage({ params }: Props) {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const { date, exerciseId } = await params;
    const data = await getMovementScreenData(date, parseInt(exerciseId));

    if (!data) {
        return (
            <main className="p-4 max-w-2xl mx-auto">
                <Link href={`/workouts/${date}`} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
                <p className="text-neutral-500 text-sm mt-4">Exercise not found for this day.</p>
            </main>
        );
    }

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="mb-2">
                <Link href={`/workouts/${date}`} className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
            </div>
            <MovementScreen
                date={date}
                exerciseId={parseInt(exerciseId)}
                initialData={{
                    workoutExerciseId: data.workoutExerciseId,
                    exerciseName: data.exerciseName,
                    muscleGroupName: data.muscleGroupName,
                    sets: data.sets,
                    allExercises: data.allExercises,
                }}
            />
            <WorkoutSidebar
                date={date}
                workoutId={data.workoutId}
                currentExerciseId={parseInt(exerciseId)}
                exercises={data.allExercises}
            />
        </main>
    );
}
