import Form from "@/app/ui/books/edit-form";
import { fetchBookById } from "@/app/lib/books/data";
import { getDummyBooks } from "@/app/lib/dummy/books";
import { Book } from "@/app/lib/classes/book";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  if(!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const id = params.id;

  const useDatabase = false;
  let book: Book | undefined;
  if (useDatabase) {
    book = await fetchBookById(id);
  } else {
    const books = getDummyBooks();
    book = books.find(x => x.id?.toString() == id);
  }

  return (
    <main>
      <Form book={book} />
    </main>
  );
}