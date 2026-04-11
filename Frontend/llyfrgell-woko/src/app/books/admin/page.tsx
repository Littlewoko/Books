import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import BulkUpdatePanel from "@/app/ui/books/bulk-update-panel";
import Header from "@/app/ui/books/header";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main className="p-4">
            <Header text="Admin Tools" colour="text-cyan-500" />
            <div className="max-w-4xl mx-auto mt-4">
                <BulkUpdatePanel />
            </div>
        </main>
    );
}
