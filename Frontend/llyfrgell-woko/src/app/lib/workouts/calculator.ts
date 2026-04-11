// Epley formula: 1RM = weight × (1 + reps / 30)
export function calculateOneRepMax(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}

// Estimate weight for a given rep count from a 1RM
export function estimateWeightForReps(oneRepMax: number, reps: number): number {
    if (reps <= 0 || oneRepMax <= 0) return 0;
    if (reps === 1) return oneRepMax;
    return oneRepMax / (1 + reps / 30);
}

// Standard rep range percentages
const REP_RANGES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

export function getRepMaxTable(weight: number, reps: number): { reps: number; weight: number }[] {
    const orm = calculateOneRepMax(weight, reps);
    if (orm <= 0) return [];
    return REP_RANGES.map(r => ({
        reps: r,
        weight: Math.round(estimateWeightForReps(orm, r) * 10) / 10,
    }));
}
