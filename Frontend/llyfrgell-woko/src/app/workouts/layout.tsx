import WorkoutOfflineProvider from "@/app/components/WorkoutOfflineProvider";

export default function WorkoutsLayout({children}: { children: React.ReactNode }) {
    return (
        <WorkoutOfflineProvider>
            {children}
        </WorkoutOfflineProvider>
    );
}
