import Form from "@/app/ui/books/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";
import Breadcrumbs from "@/app/ui/breadcrumbs";

export default async function Page() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main>
            <Breadcrumbs />
            <Header text="Create" colour="text-blue-400" />
            <Form />
        </main>
    )
}