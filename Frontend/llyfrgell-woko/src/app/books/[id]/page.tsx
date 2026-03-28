import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import BookView from "@/app/ui/books/book-view";
import { fetchNotesByBookId } from "@/app/lib/books/book-club-actions";
import SetBookTitle from "@/app/components/SetBookTitle";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;
  const [book, notes] = await Promise.all([
    fetchBookById(id),
    fetchNotesByBookId(id),
  ]);

  return (
    <main>
      <SetBookTitle title={book?.title} />
      <BookView book={book} bookClubNotes={notes} />
    </main>
  );
}
