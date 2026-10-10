import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import { sql } from "@/app/lib/db";
import { getSessionUserId } from "@/app/utils/getSessionUser";
import ExerciseAdmin from "@/app/ui/workouts/exercise-admin";
import CsvImport from "@/app/ui/workouts/csv-import";
import SyncButton from "@/app/ui/workouts/sync-button";
import FullHydrateButton from "@/app/ui/workouts/full-hydrate-button";

async function getAdminData(userId: string) {
    const [mgResult, exResult] = await Promise.all([
        sql`SELECT mg.id, COALESCE(pref.name, mg.name) AS name,
                   COALESCE(pref.colour, mg.colour, '#737373') AS colour,
                   (mg.user_id IS NULL) AS is_default
            FROM muscle_group mg
            LEFT JOIN muscle_group_preference pref
                ON pref.muscle_group_id = mg.id AND pref.user_id = ${userId}
            WHERE (mg.user_id = ${userId} OR mg.user_id IS NULL)
              AND NOT COALESCE(pref.is_hidden, false)
            ORDER BY COALESCE(pref.name, mg.name)`,
        sql`
            SELECT e.id, COALESCE(e_pref.name, e.name) AS name,
                   COALESCE(e_pref.muscle_group_id, e.muscle_group_id) AS muscle_group_id,
                   COALESCE(mg_pref.name, mg.name) AS muscle_group_name,
                   (e.user_id IS NULL) AS is_default,
                   COALESCE(s.total, 0)::int AS total_sets
            FROM exercise e
            LEFT JOIN exercise_preference e_pref
                ON e_pref.exercise_id = e.id AND e_pref.user_id = ${userId}
            JOIN muscle_group mg ON mg.id = COALESCE(e_pref.muscle_group_id, e.muscle_group_id)
            LEFT JOIN muscle_group_preference mg_pref
                ON mg_pref.muscle_group_id = mg.id AND mg_pref.user_id = ${userId}
            LEFT JOIN (
                SELECT we.exercise_id, COUNT(es.id) AS total
                FROM workout_exercise we
                JOIN workout w ON w.id = we.workout_id
                JOIN exercise_set es ON es.workout_exercise_id = we.id
                WHERE w.user_id = ${userId}
                GROUP BY we.exercise_id
            ) s ON s.exercise_id = e.id
            WHERE (e.user_id = ${userId} OR e.user_id IS NULL)
              AND (mg.user_id = ${userId} OR mg.user_id IS NULL)
              AND NOT COALESCE(e_pref.is_hidden, false)
              AND NOT COALESCE(mg_pref.is_hidden, false)
            ORDER BY COALESCE(mg_pref.name, mg.name), COALESCE(e_pref.name, e.name)
        `,
    ]);

    return {
        muscleGroups: mgResult.rows.map(r => ({
            id: r.id as number,
            name: r.name as string,
            colour: r.colour as string,
            isDefault: r.is_default as boolean,
        })),
        exercises: exResult.rows.map(r => ({
            id: r.id as number,
            name: r.name as string,
            muscleGroupId: r.muscle_group_id as number,
            muscleGroupName: r.muscle_group_name as string,
            totalSets: r.total_sets as number,
            isDefault: r.is_default as boolean,
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

            <div className="mb-4 flex flex-col gap-2">
                <SyncButton />
                <FullHydrateButton />
            </div>

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
