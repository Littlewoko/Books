"use client";

import {useEffect, useState} from "react";
import {localGetDayVolume} from "@/app/lib/workouts/local-data";
import {getMuscleGroupColour} from "@/app/lib/workouts/muscle-group-colours";

interface Props {
    date: string;
}

export default function DayVolume({date}: Props) {
    const [data, setData] = useState<{ muscleGroup: string; sets: number }[]>([]);

    useEffect(() => {
        localGetDayVolume(date).then(setData);
    }, [date]);

    if (data.length === 0) return null;

    const total = data.reduce((sum, d) => sum + d.sets, 0);

    return (
        <div className="flex flex-wrap gap-2 items-center mt-3 mb-1">
            {data.map(({muscleGroup, sets}) => (
                <span key={muscleGroup} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{backgroundColor: getMuscleGroupColour(muscleGroup)}}/>
                    <span className="text-black text-xs">{muscleGroup}</span>
                    <span className="text-black/40 text-xs">{sets}</span>
                </span>
            ))}
            <span className="text-black/30 text-xs">· {total} total</span>
        </div>
    );
}
