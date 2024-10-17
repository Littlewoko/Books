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
        <div className="flex flex-col m-1 gap-y-1">
            {bookCardItems}
        </div>
    );
}

export default Table;