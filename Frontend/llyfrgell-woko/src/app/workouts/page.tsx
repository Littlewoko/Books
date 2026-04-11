import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import WorkoutCalendar from "@/app/ui/workouts/workout-calendar";

export default async function WorkoutsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main className="p-4">
            <WorkoutCalendar />
        </main>
    );
}
