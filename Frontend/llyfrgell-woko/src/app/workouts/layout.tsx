import WorkoutOfflineProvider from "@/app/components/WorkoutOfflineProvider";
import WorkoutAuthGuard from "@/app/components/WorkoutAuthGuard";

export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
    return (
        <WorkoutAuthGuard>
            <WorkoutOfflineProvider>
                {children}
            </WorkoutOfflineProvider>
        </WorkoutAuthGuard>
    );
}
