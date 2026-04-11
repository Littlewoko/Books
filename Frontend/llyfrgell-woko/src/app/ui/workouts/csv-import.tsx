"use client";

import { useState } from "react";
import { Typography, CircularProgress, LinearProgress } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Papa from "papaparse";
import { CsvRow, MuscleGroupMapping, importSetup, importChunk } from "@/app/lib/workouts/import";

const DAYS_PER_CHUNK = 10;

type Step = "upload" | "mapping" | "importing" | "done";

type ExerciseInfo = {
    name: string;
    csvCategory: string;
    muscleGroup: string;
    setCount: number;
};

type ImportTotals = {
    muscleGroupsCreated: number;
    exercisesCreated: number;
    workoutsCreated: number;
    setsCreated: number;
    errors: string[];
};

export default function CsvImport() {
    const [step, setStep] = useState<Step>("upload");
    const [rows, setRows] = useState<CsvRow[]>([]);
    const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
    const [totals, setTotals] = useState<ImportTotals | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (parsed) => {
                setRows(parsed.data);

                const exerciseMap = new Map<string, { category: string; count: number }>();
                for (const row of parsed.data) {
                    const existing = exerciseMap.get(row.Exercise);
                    if (existing) {
                        existing.count++;
                    } else {
                        exerciseMap.set(row.Exercise, { category: row.Category, count: 1 });
                    }
                }

                const exerciseList: ExerciseInfo[] = Array.from(exerciseMap.entries())
                    .map(([name, info]) => ({
                        name,
                        csvCategory: info.category,
                        muscleGroup: info.category,
                        setCount: info.count,
                    }))
                    .sort((a, b) => a.csvCategory.localeCompare(b.csvCategory) || a.name.localeCompare(b.name));

                setExercises(exerciseList);
                setStep("mapping");
            },
        });
    };

    const updateMuscleGroup = (exerciseName: string, muscleGroup: string) => {
        setExercises(prev =>
            prev.map(ex => ex.name === exerciseName ? { ...ex, muscleGroup } : ex)
        );
    };

    const handleImport = async () => {
        setStep("importing");

        const accumulated: ImportTotals = {
            muscleGroupsCreated: 0,
            exercisesCreated: 0,
            workoutsCreated: 0,
            setsCreated: 0,
            errors: [],
        };

        // Phase 1: Setup muscle groups and exercises
        setProgress({ current: 0, total: 0, phase: "Creating exercises and muscle groups..." });

        const mappings: MuscleGroupMapping = {};
        for (const ex of exercises) {
            mappings[ex.name] = { csvCategory: ex.csvCategory, muscleGroup: ex.muscleGroup };
        }

        const setupResult = await importSetup(mappings);
        accumulated.muscleGroupsCreated = setupResult.muscleGroupsCreated;
        accumulated.exercisesCreated = setupResult.exercisesCreated;
        accumulated.errors.push(...setupResult.errors);

        if (setupResult.errors.length > 0) {
            setTotals(accumulated);
            setStep("done");
            return;
        }

        // Phase 2: Group rows by date, then chunk by days
        const dayGroups = new Map<string, CsvRow[]>();
        for (const row of rows) {
            const date = row.Date;
            if (!dayGroups.has(date)) dayGroups.set(date, []);
            dayGroups.get(date)!.push(row);
        }

        const dayEntries = Array.from(dayGroups.entries());
        const totalChunks = Math.ceil(dayEntries.length / DAYS_PER_CHUNK);

        for (let i = 0; i < dayEntries.length; i += DAYS_PER_CHUNK) {
            const chunkIndex = Math.floor(i / DAYS_PER_CHUNK) + 1;
            setProgress({
                current: chunkIndex,
                total: totalChunks,
                phase: `Importing workouts (batch ${chunkIndex}/${totalChunks})...`,
            });

            const chunkDays = dayEntries.slice(i, i + DAYS_PER_CHUNK);
            const chunkRows = chunkDays.flatMap(([, dayRows]) => dayRows);

            const chunkResult = await importChunk(chunkRows, setupResult.exerciseIds);
            accumulated.workoutsCreated += chunkResult.workoutsCreated;
            accumulated.setsCreated += chunkResult.setsCreated;
            accumulated.errors.push(...chunkResult.errors);
        }

        setTotals(accumulated);
        setStep("done");
    };

    const distinctMuscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].sort();
    const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
        <div className="p-4 border border-gray-600 rounded bg-black/30">
            {/* Upload Step */}
            {step === "upload" && (
                <div>
                    <Typography className="text-gray-300 mb-3" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
                        Import Workout History from CSV
                    </Typography>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded cursor-pointer hover:border-amber-600 transition-colors">
                        <div className="text-center">
                            <Typography className="text-gray-400" sx={{ fontSize: '14px' }}>
                                Click to select CSV file
                            </Typography>
                            <Typography className="text-gray-500 mt-1" sx={{ fontSize: '12px' }}>
                                Expected columns: Date, Exercise, Category, Weight, Reps, etc.
                            </Typography>
                        </div>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {/* Mapping Step */}
            {step === "mapping" && (
                <div>
                    <Typography className="text-gray-300 mb-1" sx={{ fontSize: { xs: '14px', sm: '16px' } }}>
                        Review Exercise → Muscle Group Mapping
                    </Typography>
                    <Typography className="text-gray-500 mb-3" sx={{ fontSize: '12px' }}>
                        {rows.length} rows parsed · {exercises.length} distinct exercises · {distinctMuscleGroups.length} muscle groups
                    </Typography>

                    <div className="max-h-[60vh] overflow-y-auto mb-4">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-stone-900">
                                <tr className="text-left text-gray-400 border-b border-gray-600">
                                    <th className="p-2">Exercise</th>
                                    <th className="p-2">CSV Category</th>
                                    <th className="p-2">Muscle Group</th>
                                    <th className="p-2 text-right">Sets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exercises.map((ex) => (
                                    <tr key={ex.name} className="border-b border-gray-700/50">
                                        <td className="p-2 text-amber-100/90">{ex.name}</td>
                                        <td className="p-2 text-gray-500">{ex.csvCategory}</td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ex.muscleGroup}
                                                onChange={(e) => updateMuscleGroup(ex.name, e.target.value)}
                                                list="muscle-groups"
                                                className="w-full bg-transparent border-b border-gray-600 text-amber-200/80 text-sm p-1 focus:outline-none focus:border-amber-700"
                                            />
                                        </td>
                                        <td className="p-2 text-right text-gray-400">{ex.setCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <datalist id="muscle-groups">
                            {distinctMuscleGroups.map(mg => (
                                <option key={mg} value={mg} />
                            ))}
                        </datalist>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { setStep("upload"); setRows([]); setExercises([]); }}
                            className="text-gray-400 hover:text-gray-200 transition-colors text-sm px-4 py-2"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleImport}
                            className="flex items-center text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:bg-gradient-to-l font-small rounded-lg text-sm p-2 px-4"
                        >
                            <CheckCircleIcon className="mr-2" fontSize="small" />
                            Import {rows.length} rows
                        </button>
                    </div>
                </div>
            )}

            {/* Importing Step */}
            {step === "importing" && (
                <div className="flex flex-col items-center gap-3 py-8">
                    <CircularProgress size={32} className="text-amber-500" />
                    <Typography className="text-gray-300" sx={{ fontSize: '14px' }}>
                        {progress.phase}
                    </Typography>
                    {progress.total > 0 && (
                        <>
                            <LinearProgress
                                variant="determinate"
                                value={progressPercent}
                                className="w-full max-w-md"
                            />
                            <Typography className="text-gray-500" sx={{ fontSize: '12px' }}>
                                {progress.current} / {progress.total} batches
                            </Typography>
                        </>
                    )}
                </div>
            )}

            {/* Done Step */}
            {step === "done" && totals && (
                <div>
                    <div className={`p-4 rounded border ${totals.errors.length === 0 ? 'border-green-600 bg-green-900/20' : 'border-yellow-600 bg-yellow-900/20'}`}>
                        <Typography className="text-gray-200 mb-3" sx={{ fontSize: '16px' }}>
                            Import Complete
                        </Typography>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div className="text-gray-400">Muscle groups created:</div>
                            <div className="text-green-400">{totals.muscleGroupsCreated}</div>
                            <div className="text-gray-400">Exercises created:</div>
                            <div className="text-green-400">{totals.exercisesCreated}</div>
                            <div className="text-gray-400">Workouts created:</div>
                            <div className="text-green-400">{totals.workoutsCreated}</div>
                            <div className="text-gray-400">Sets created:</div>
                            <div className="text-green-400">{totals.setsCreated}</div>
                        </div>
                        {totals.errors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <Typography className="text-red-400 mb-2" sx={{ fontSize: '14px' }}>
                                    <ErrorIcon fontSize="small" className="mr-1 align-text-bottom" />
                                    {totals.errors.length} error(s)
                                </Typography>
                                <div className="max-h-40 overflow-y-auto text-sm text-red-300">
                                    {totals.errors.map((err, i) => (
                                        <div key={i}>• {err}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => { setStep("upload"); setRows([]); setExercises([]); setTotals(null); }}
                        className="mt-3 text-gray-400 hover:text-gray-200 transition-colors text-sm"
                    >
                        Import another file
                    </button>
                </div>
            )}
        </div>
    );
}
