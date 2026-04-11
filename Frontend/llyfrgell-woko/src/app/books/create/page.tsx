import Form from "@/app/ui/books/create-form"
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    return (
        <main>
            <Form />
        </main>
    )
}
