import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import Header from "@/app/ui/books/header";
import CsvImport from "@/app/ui/workouts/csv-import";

export default async function WorkoutAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main className="p-4">
            <Header text="Workout Admin" colour="text-cyan-500" />
            <div className="max-w-4xl mx-auto mt-4">
                <CsvImport />
            </div>
        </main>
    );
}
