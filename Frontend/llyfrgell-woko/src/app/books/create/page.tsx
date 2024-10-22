import Form from "@/app/ui/books/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession();
    if (!session || !session.user) {
      redirect("/api/auth/signin");
    }

    return (
        <main>
            <Form action={null} />
        </main>
    )
}