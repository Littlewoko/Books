import Form from "@/app/ui/books/edit-form";
import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";
import BookClubEditor from "@/app/ui/books/book-club-editor";
import { fetchNotesByBookId } from "@/app/lib/books/book-club-actions";
import Breadcrumbs from "@/app/ui/breadcrumbs";

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
      <Breadcrumbs bookTitle={book?.title} />
      <Header text="Update" colour="text-purple-500"/>
      <Form book={book} />
      {book?.id && (
        <div className="mb-12">
          <BookClubEditor bookId={book.id.toString()} initialNotes={notes} />
        </div>
      )}
    </main>
  );
}