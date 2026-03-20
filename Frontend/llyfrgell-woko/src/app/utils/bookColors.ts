export const bookColors = [
    'from-amber-900 to-amber-950',
    'from-emerald-900 to-emerald-950',
    'from-red-900 to-red-950',
    'from-indigo-900 to-indigo-950',
    'from-stone-700 to-stone-800',
    'from-cyan-900 to-cyan-950',
    'from-violet-900 to-violet-950',
    'from-rose-900 to-rose-950',
    'from-teal-900 to-teal-950',
    'from-sky-900 to-sky-950',
    'from-slate-700 to-slate-800',
    'from-zinc-700 to-zinc-800',
];

export function getBookColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bookColors[Math.abs(hash) % bookColors.length];
}

export function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}
