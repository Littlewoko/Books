import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import { redirect } from "next/navigation";
import { fetchAllBooks } from "@/app/lib/books/data";
import Library3DWrapper from "@/app/ui/books/library-3d-wrapper";

export default async function LibraryPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const books = await fetchAllBooks();

    return <Library3DWrapper books={books} />;
}
