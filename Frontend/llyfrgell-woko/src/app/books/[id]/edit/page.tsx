import Form from "@/app/ui/books/edit-form";
import { fetchBookById } from "@/app/lib/books/data";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Header from "@/app/ui/books/header";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  const id = params.id;

  const book = await fetchBookById(id);

  return (
    <main>
      <Header text="Update" colour="text-purple-500"/>
      <Form book={book} />
    </main>
  );
}