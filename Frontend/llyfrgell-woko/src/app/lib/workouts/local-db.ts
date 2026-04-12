import Dexie, {type EntityTable} from 'dexie';

export interface LocalMuscleGroup {
    id: number;
    name: string;
}

export interface LocalExercise {
    id: number;
    name: string;
    muscleGroupId: number;
    muscleGroupName: string;
}

export interface LocalWorkout {
    id: number;
    date: string;
    notes?: string | null;
}

export interface LocalWorkoutExercise {
    id: number;
    workoutId: number;
    exerciseId: number;
    sortOrder: number;
    exerciseName: string;
    muscleGroupName: string;
    setCount: number;
}

export interface LocalExerciseSet {
    id: number;
    workoutExerciseId: number;
    weight: number | null;
    weightUnit: string;
    reps: number | null;
    distance: number | null;
    distanceUnit: string | null;
    duration: number | null;
    tempo: string | null;
    notes: string | null;
    sortOrder: number;
}

export interface SyncQueueItem {
    localId?: number;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    recordId: number;
    payload: Record<string, unknown>;
    createdAt: number;
    status: 'pending' | 'processing' | 'failed';
    error?: string;
}

export interface IdMapEntry {
    id?: number;
    table: string;
    localId: number;
    serverId: number;
}

export interface SyncMeta {
    key: string;
    value: string;
}

const db = new Dexie('llyfrgell-workouts') as Dexie & {
    muscleGroups: EntityTable<LocalMuscleGroup, 'id'>;
    exercises: EntityTable<LocalExercise, 'id'>;
    workouts: EntityTable<LocalWorkout, 'id'>;
    workoutExercises: EntityTable<LocalWorkoutExercise, 'id'>;
    exerciseSets: EntityTable<LocalExerciseSet, 'id'>;
    syncQueue: EntityTable<SyncQueueItem, 'localId'>;
    idMap: EntityTable<IdMapEntry, 'id'>;
    syncMeta: EntityTable<SyncMeta, 'key'>;
};

db.version(1).stores({
    muscleGroups: 'id, name',
    exercises: 'id, muscleGroupId, name',
    workouts: 'id, date',
    workoutExercises: 'id, workoutId, exerciseId',
    exerciseSets: 'id, workoutExerciseId',
    syncQueue: '++localId, status, createdAt',
    idMap: '++id, [table+localId], [table+serverId]',
    syncMeta: 'key',
});

export {db};

// Generate negative local IDs that won't collide across page reloads.
// Derives from the current minimum ID across all tables.
let localIdCounter: number | null = null;

export async function nextLocalId(): Promise<number> {
    if (localIdCounter === null) {
        const mins = await Promise.all([
            db.muscleGroups.orderBy('id').first().then(r => r?.id ?? 0),
            db.exercises.orderBy('id').first().then(r => r?.id ?? 0),
            db.workouts.orderBy('id').first().then(r => r?.id ?? 0),
            db.workoutExercises.orderBy('id').first().then(r => r?.id ?? 0),
            db.exerciseSets.orderBy('id').first().then(r => r?.id ?? 0),
        ]);
        localIdCounter = Math.min(...mins, 0) - 1;
    }
    return localIdCounter--;
}
