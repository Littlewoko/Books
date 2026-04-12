import {db} from './local-db';

const DEFAULT_COLOUR = '#737373';

let colourCache: Map<string, string> | null = null;

export async function loadMuscleGroupColours(): Promise<Map<string, string>> {
    const mgs = await db.muscleGroups.toArray();
    colourCache = new Map(mgs.map(mg => [mg.name, mg.colour || DEFAULT_COLOUR]));
    return colourCache;
}

export function getMuscleGroupColour(name: string): string {
    return colourCache?.get(name) || DEFAULT_COLOUR;
}

export function invalidateColourCache() {
    colourCache = null;
}
