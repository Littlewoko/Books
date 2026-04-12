import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "@/app/utils/getSessionUser";
import ExerciseAdmin from "@/app/ui/workouts/exercise-admin";
import CsvImport from "@/app/ui/workouts/csv-import";

async function getAdminData(userId: string) {
    const [mgResult, exResult] = await Promise.all([
        sql`SELECT id, name FROM muscle_group WHERE user_id = ${userId} ORDER BY name`,
        sql`
            SELECT e.id, e.name, e.muscle_group_id, mg.name AS muscle_group_name,
                   COALESCE(s.total, 0)::int AS total_sets
            FROM exercise e
            JOIN muscle_group mg ON mg.id = e.muscle_group_id
            LEFT JOIN (
                SELECT we.exercise_id, COUNT(es.id) AS total
                FROM workout_exercise we
                JOIN exercise_set es ON es.workout_exercise_id = we.id
                GROUP BY we.exercise_id
            ) s ON s.exercise_id = e.id
            WHERE e.user_id = ${userId}
            ORDER BY mg.name, e.name
        `,
    ]);

    return {
        muscleGroups: mgResult.rows.map(r => ({ id: r.id as number, name: r.name as string })),
        exercises: exResult.rows.map(r => ({
            id: r.id as number,
            name: r.name as string,
            muscleGroupId: r.muscle_group_id as number,
            muscleGroupName: r.muscle_group_name as string,
            totalSets: r.total_sets as number,
        })),
    };
}

export default async function WorkoutAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const userId = await getSessionUserId();
    const { muscleGroups, exercises } = await getAdminData(userId);

    return (
        <main className="p-4 max-w-4xl mx-auto">
            <h1 className="text-black text-xl sm:text-2xl mb-4 font-bold" style={{ fontFamily: 'var(--font-caveat)' }}>
                Admin
            </h1>

            <section className="mb-8">
                <h2 className="text-amber-700 text-sm font-bold mb-2">Exercises</h2>
                <ExerciseAdmin exercises={exercises} muscleGroups={muscleGroups} />
            </section>

            <section>
                <h2 className="text-amber-700 text-sm font-bold mb-2">CSV Import</h2>
                <CsvImport />
            </section>
        </main>
    );
}
