'use server';

import { sql } from '@vercel/postgres';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

export type CsvRow = {
    Date: string;
    Exercise: string;
    Category: string;
    Weight: string;
    'Weight Unit': string;
    Reps: string;
    Distance: string;
    'Distance Unit': string;
    Time: string;
    Comment: string;
};

export type MuscleGroupMapping = {
    [exerciseName: string]: {
        csvCategory: string;
        muscleGroup: string;
    };
};

export type SetupResult = {
    muscleGroupIds: Record<string, number>;
    exerciseIds: Record<string, number>;
    muscleGroupsCreated: number;
    exercisesCreated: number;
    errors: string[];
};

export type ChunkResult = {
    workoutsCreated: number;
    setsCreated: number;
    errors: string[];
};

// Phase 1: Create muscle groups and exercises (small number of queries)
export async function importSetup(mappings: MuscleGroupMapping): Promise<SetupResult> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result: SetupResult = {
        muscleGroupIds: {},
        exerciseIds: {},
        muscleGroupsCreated: 0,
        exercisesCreated: 0,
        errors: [],
    };

    try {
        const muscleGroupNames = [...new Set(Object.values(mappings).map(m => m.muscleGroup))];

        for (const name of muscleGroupNames) {
            const existing = await sql`
                SELECT id FROM muscle_group WHERE name = ${name} AND user_id = ${userId};
            `;
            if (existing.rows[0]) {
                result.muscleGroupIds[name] = existing.rows[0].id;
            } else {
                const inserted = await sql`
                    INSERT INTO muscle_group (name, user_id) VALUES (${name}, ${userId}) RETURNING id;
                `;
                result.muscleGroupIds[name] = inserted.rows[0].id;
                result.muscleGroupsCreated++;
            }
        }

        for (const [exerciseName, mapping] of Object.entries(mappings)) {
            const mgId = result.muscleGroupIds[mapping.muscleGroup];
            const existing = await sql`
                SELECT id FROM exercise WHERE name = ${exerciseName} AND user_id = ${userId};
            `;
            if (existing.rows[0]) {
                result.exerciseIds[exerciseName] = existing.rows[0].id;
            } else {
                const inserted = await sql`
                    INSERT INTO exercise (name, muscle_group_id, user_id)
                    VALUES (${exerciseName}, ${mgId}, ${userId}) RETURNING id;
                `;
                result.exerciseIds[exerciseName] = inserted.rows[0].id;
                result.exercisesCreated++;
            }
        }
    } catch (error) {
        result.errors.push(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
}

// Phase 2: Import a chunk of days (called repeatedly from the client)
export async function importChunk(
    rows: CsvRow[],
    exerciseIds: Record<string, number>
): Promise<ChunkResult> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result: ChunkResult = { workoutsCreated: 0, setsCreated: 0, errors: [] };

    try {
        const dayGroups = new Map<string, CsvRow[]>();
        for (const row of rows) {
            const dateKey = normaliseDate(row.Date);
            if (!dateKey) {
                result.errors.push(`Invalid date: ${row.Date}`);
                continue;
            }
            if (!dayGroups.has(dateKey)) dayGroups.set(dateKey, []);
            dayGroups.get(dateKey)!.push(row);
        }

        for (const [dateKey, dayRows] of dayGroups) {
            const workoutResult = await sql`
                INSERT INTO workout (date, user_id)
                VALUES (${dateKey}, ${userId})
                ON CONFLICT (date, user_id) DO UPDATE SET date = EXCLUDED.date
                RETURNING id;
            `;
            const workoutId = workoutResult.rows[0].id;
            result.workoutsCreated++;

            const exerciseOrder: string[] = [];
            const exerciseSets = new Map<string, CsvRow[]>();

            for (const row of dayRows) {
                if (!exerciseSets.has(row.Exercise)) {
                    exerciseOrder.push(row.Exercise);
                    exerciseSets.set(row.Exercise, []);
                }
                exerciseSets.get(row.Exercise)!.push(row);
            }

            for (let i = 0; i < exerciseOrder.length; i++) {
                const exerciseName = exerciseOrder[i];
                const exerciseId = exerciseIds[exerciseName];
                if (!exerciseId) {
                    result.errors.push(`Unknown exercise: ${exerciseName}`);
                    continue;
                }

                const weResult = await sql`
                    INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
                    VALUES (${workoutId}, ${exerciseId}, ${i})
                    RETURNING id;
                `;
                const workoutExerciseId = weResult.rows[0].id;

                const sets = exerciseSets.get(exerciseName)!;
                for (let j = 0; j < sets.length; j++) {
                    const s = sets[j];
                    const weight = s.Weight ? parseFloat(s.Weight) : null;
                    const weightUnit = s['Weight Unit'] || 'kgs';
                    const reps = s.Reps ? parseInt(s.Reps) : null;
                    const distance = s.Distance ? parseFloat(s.Distance) : null;
                    const distanceUnit = s['Distance Unit'] || null;
                    const duration = s.Time ? parseDuration(s.Time) : null;
                    const notes = s.Comment || null;

                    await sql`
                        INSERT INTO exercise_set
                            (workout_exercise_id, weight, weight_unit, reps, distance, distance_unit, duration, notes, sort_order)
                        VALUES
                            (${workoutExerciseId}, ${weight}, ${weightUnit}, ${reps}, ${distance}, ${distanceUnit}, ${duration}, ${notes}, ${j});
                    `;
                    result.setsCreated++;
                }
            }
        }
    } catch (error) {
        result.errors.push(`Chunk import failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
}

function normaliseDate(dateStr: string): string | null {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
}

function parseDuration(timeStr: string): number | null {
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
}
