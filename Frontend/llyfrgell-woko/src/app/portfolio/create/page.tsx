import Form from "@/app/ui/portfolio/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        redirect("/api/auth/signin");
    }

    return (
        <main className="max-w-3xl mx-auto p-4">
            <h1
                className="text-amber-200/90 text-2xl sm:text-3xl mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Create Portfolio Item
            </h1>
            <Form />
        </main>
    )
}
