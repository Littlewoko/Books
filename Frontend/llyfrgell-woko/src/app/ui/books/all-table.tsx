import { Book } from "@/app/lib/classes/book";

import BookComponent from "./book";

interface TableProps {
    books: Book[]
}

const Table: React.FC<TableProps> = ({ books }) => {
    const bookCardItems = books.map((book) => (
        <BookComponent book={book} key={book.id}/>
    ));

    return (
        <div>
            {bookCardItems}
        </div>
    );
}

export default Table;