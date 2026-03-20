export const bookColors = [
    'from-amber-800 to-amber-900',
    'from-emerald-800 to-emerald-900',
    'from-red-900 to-red-950',
    'from-indigo-800 to-indigo-950',
    'from-stone-700 to-stone-800',
    'from-cyan-800 to-cyan-900',
    'from-violet-800 to-violet-950',
    'from-rose-800 to-rose-900',
    'from-teal-800 to-teal-900',
    'from-orange-800 to-orange-950',
    'from-sky-800 to-sky-900',
    'from-fuchsia-800 to-fuchsia-950',
];

export function getBookColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bookColors[Math.abs(hash) % bookColors.length];
}
