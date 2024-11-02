import Form from "@/app/ui/portfolio/edit-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";
import { fetchUserPortfolioById } from "@/app/lib/portfolio/data";

export default async function Page({ params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
        redirect("/api/auth/signin");
    }

    const id = params.id;
    const portfolio = await fetchUserPortfolioById(id, session.user.email);

    return (
        <main>
            <Header text="Update Portfolio Item" colour="text-purple-500" />
            <Form portfolio={portfolio} />
        </main>
    )
}