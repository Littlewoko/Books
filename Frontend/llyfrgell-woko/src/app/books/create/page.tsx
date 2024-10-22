import Form from "@/app/ui/books/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";

export default async function Page() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main>
            <Header text="Create" colour="text-blue-400" />
            <Form />
        </main>
    )
}