import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";
import BookView from "@/app/ui/books/book-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;
  const book = await fetchBookById(id);

  return (
    <main>
      <Header text="Book Details" colour="text-orange-400"/>
      <BookView book={book} />
    </main>
  );
}
