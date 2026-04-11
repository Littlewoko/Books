import Form from "@/app/ui/books/edit-form";
import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";
import BookClubEditor from "@/app/ui/books/book-club-editor";
import { fetchNotesByBookId } from "@/app/lib/books/book-club-actions";
import SetBookTitle from "@/app/components/SetBookTitle";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;
  const { returnTo } = await searchParams;

  const [book, notes] = await Promise.all([
    fetchBookById(id),
    fetchNotesByBookId(id),
  ]);

  return (
    <main>
      <SetBookTitle title={book?.title} returnTo={returnTo} />
      <Form book={book} returnTo={returnTo} />
      {book?.id && (
        <div className="mb-12">
          <BookClubEditor bookId={book.id.toString()} initialNotes={notes} />
        </div>
      )}
    </main>
  );
}
