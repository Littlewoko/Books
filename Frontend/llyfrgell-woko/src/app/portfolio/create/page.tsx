import Form from "@/app/ui/portfolio/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";

export default async function Page() {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
        redirect("/api/auth/signin");
    }

    return (
        <main>
            <Header text="Create Portfolio Item" colour="text-blue-400" />
            <Form/>
        </main>
    )
}