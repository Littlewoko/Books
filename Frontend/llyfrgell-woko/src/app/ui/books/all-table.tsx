import { Book } from "@/app/lib/classes/book";
// import formatDate from "@/app/utils/formatDate";
// import Link from "next/link";
import BookComponent from "./book";

interface TableProps {
    books: Book[]
}

const Table: React.FC<TableProps> = ({ books }) => {
    // const booksItems = books.map((book) => (
    //     <tr key={book.title} className="border-b">
    //         <td className="p-2">{book.title}</td>
    //         <td className="p-2">{book.author}</td>
    //         <td className="p-2">{book.genre}</td>
    //         <td className="p-2">{book.isbn || null}</td>
    //         <td className="p-2">{book.dateObtained ? formatDate(book.dateObtained?.toDateString()) : null}</td>
    //         <td className="p-2">{book.dateStartedReading ? formatDate(book.dateStartedReading?.toDateString()) : null}</td>
    //         <td className="p-2">{book.dateCompleted ? formatDate(book.dateCompleted?.toDateString()) : null}</td>
    //         <td className="p-2">{book.considerTowardsTotalBooksCompleted ? "yes" : "no"}</td>
    //         <td className="p-2">
    //             <Link href={`/books/${book.id}/edit`}>
    //                 Edit
    //             </Link>
    //         </td>
    //     </tr>
    // ));

    const bookCardItems = books.map((book) => (
        <BookComponent book={book} key={book.id}/>
    ));

    return (
        // <table className="w-full border-collapse">
        //     <thead  className="bg-gray-200">
        //         <tr>
        //             <th className="p-2">Title</th>
        //             <th className="p-2">Author</th>
        //             <th className="p-2">Genre</th>
        //             <th className="p-2">ISBN</th>
        //             <th className="p-2">Obtained on</th>
        //             <th className="p-2">Started on</th>
        //             <th className="p-2">Completed on</th>
        //             <th className="p-2">Include in total</th>
        //             <th className="p-2">Edit</th>
        //         </tr>
        //     </thead>
        //     <tbody>
        //         {booksItems.length > 0 ? booksItems : 'Uh oh! no books'}
        //     </tbody>
        // </table>

        <div>
            {bookCardItems}
        </div>
    );
}

export default Table;