import { fetchAllBooks } from "@/app/lib/books/data";
import Library3DWrapper from "@/app/ui/books/library-3d-wrapper";

export default async function LibraryPage() {
    const books = await fetchAllBooks();

    return <Library3DWrapper books={books} />;
}
