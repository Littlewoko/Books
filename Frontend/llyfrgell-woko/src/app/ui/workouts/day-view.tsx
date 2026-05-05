"use client";

import {useEffect, useState} from "react";
import {localGetWorkoutForDate} from "@/app/lib/workouts/local-data";
import {WorkoutExercise} from "@/app/lib/workouts/types";
import {useOffline} from "@/app/components/WorkoutOfflineProvider";
import DayExerciseList from "@/app/ui/workouts/day-exercise-list";
import DayVolume from "@/app/ui/workouts/day-volume";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SyncIcon from '@mui/icons-material/Sync';
import {useRouter} from "next/navigation";

interface Props {
    date: string;
}

function shiftDate(date: string, days: number): string {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function DayView({date}: Props) {
    const router = useRouter();
    const {sync, pendingSyncs, isOnline} = useOffline();
    const [workoutId, setWorkoutId] = useState<number | null>(null);
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        setLoaded(false);
        localGetWorkoutForDate(date).then(data => {
            setWorkoutId(data?.workout.id ?? null);
            setExercises(data?.exercises ?? []);
            setLoaded(true);
        });
    }, [date]);

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (!loaded) return null;

    const handleSync = async () => {
        setSyncing(true);
        try {
            await sync();
            const data = await localGetWorkoutForDate(date);
            setWorkoutId(data?.workout.id ?? null);
            setExercises(data?.exercises ?? []);
        } finally { setSyncing(false); }
    };

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/workouts" className="text-black hover:text-amber-700 transition-colors">
                    <ArrowBackIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </Link>
                <button type="button" onClick={() => router.push(`/workouts/${shiftDate(date, -1)}`)}
                        className="text-black/40 hover:text-black transition-colors">
                    <ChevronLeftIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </button>
                <h1 className="text-black text-xl sm:text-2xl font-bold flex-1"
                    style={{fontFamily: 'var(--font-caveat)'}}>
                    {displayDate}
                </h1>
                <button type="button" onClick={() => router.push(`/workouts/${shiftDate(date, 1)}`)}
                        className="text-black/40 hover:text-black transition-colors">
                    <ChevronRightIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </button>
                <button type="button" onClick={handleSync} disabled={syncing || !isOnline}
                        className="text-amber-700 hover:text-amber-800 transition-colors disabled:text-black/20 relative">
                    <SyncIcon sx={{fontSize: 20, color: 'inherit'}} className={syncing ? 'animate-spin' : ''}/>
                    {pendingSyncs > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                            {pendingSyncs > 9 ? '9+' : pendingSyncs}
                        </span>
                    )}
                </button>
            </div>
            <DayExerciseList date={date} workoutId={workoutId} exercises={exercises}/>
            <DayVolume date={date}/>
        </main>
    );
}
