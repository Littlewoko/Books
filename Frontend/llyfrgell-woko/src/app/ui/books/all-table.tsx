import { Book } from "@/app/lib/classes/book";

interface TableProps {
    books: Book[]
}

const Table: React.FC<TableProps> = ({ books }) => {
    const booksItems = books.map((book) => (
        <tr key={book.title}>
            <td>{book.title}</td>
            <td>{book.author}</td>
            <td>{book.genre}</td>
            <td>{book.isbn || null}</td>
            <td>{book.dateObtained?.toISOString().split("T")[0] || null}</td>
            <td>{book.dateStartedReading?.toISOString().split("T")[0] || null}</td>
            <td>{book.dateCompleted?.toISOString().split("T")[0] || null}</td>
            <td>{book.considerTowardsTotalBooksCompleted ? "yes" : "no"}</td>
        </tr>
    ));

    return (
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>ISBN</th>
                    <th>Obtained on</th>
                    <th>Started on</th>
                    <th>Completed on</th>
                    <th>Include in total</th>
                </tr>
            </thead>
            <tbody>
                {booksItems.length > 0 ? booksItems : 'Uh oh! no books'}
            </tbody>
        </table>
    );
}

export default Table;