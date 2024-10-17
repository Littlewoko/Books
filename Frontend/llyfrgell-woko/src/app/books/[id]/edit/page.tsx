import Form from "@/app/ui/books/edit-form";
import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const id = params.id;

  const book = await fetchBookById(id);

  return (
    <main>
      <Form book={book} />
    </main>
  );
}