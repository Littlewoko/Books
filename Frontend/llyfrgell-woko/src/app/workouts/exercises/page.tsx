import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ExerciseManager from "@/app/ui/workouts/exercise-manager";

export default async function ExercisesPage() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <h1
                className="text-black text-xl sm:text-2xl mb-4 font-bold"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Exercises
            </h1>
            <ExerciseManager />
        </main>
    );
}
