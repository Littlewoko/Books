import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { fetchAllBooks } from "@/app/lib/books/data";
import LibraryShelves from "@/app/ui/books/library-shelves";

export default async function LibraryPage() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const books = await fetchAllBooks();

    return (
        <main className="p-4">
            <div className="max-w-3xl mx-auto">
                <h1
                    className="text-amber-200/90 text-2xl sm:text-3xl mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                >
                    Catalogue
                </h1>
                <LibraryShelves books={books} />
            </div>
        </main>
    );
}
