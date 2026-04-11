import Form from "@/app/ui/portfolio/edit-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { fetchUserPortfolioById } from "@/app/lib/portfolio/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        redirect("/api/auth/signin");
    }

    const { id } = await params;
    const data = await fetchUserPortfolioById(id);

    return (
        <main className="max-w-3xl mx-auto p-4">
            <h1
                className="text-amber-200/90 text-2xl sm:text-3xl mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Update Portfolio Item
            </h1>
            <Form portfolio={data} />
        </main>
    )
}
