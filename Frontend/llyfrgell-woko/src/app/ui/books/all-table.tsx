import { Book } from "@/app/lib/classes/book";
import BookSpine from "./book-spine";
import { Typography } from "@mui/material";

interface TableProps {
    books: Book[]
}

interface ShelfRow {
    label: string;
    books: Book[];
    color: string;
}

function groupBooks(books: Book[]): ShelfRow[] {
    const inProgress = books.filter(b => b.dateStartedReading && !b.dateCompleted);
    const completed = books.filter(b => !!b.dateCompleted);
    const owned = books.filter(b => b.dateObtained && !b.dateStartedReading && !b.dateCompleted);
    const notOwned = books.filter(b => !b.dateObtained && !b.dateStartedReading && !b.dateCompleted);

    const rows: ShelfRow[] = [];
    if (inProgress.length) rows.push({ label: 'Currently Reading', books: inProgress, color: 'text-violet-400' });
    if (completed.length) rows.push({ label: 'Completed', books: completed, color: 'text-yellow-500' });
    if (owned.length) rows.push({ label: 'On the Shelf', books: owned, color: 'text-slate-400' });
    if (notOwned.length) rows.push({ label: 'Wishlist', books: notOwned, color: 'text-slate-500' });
    return rows;
}

const Table: React.FC<TableProps> = ({ books }) => {
    const shelves = groupBooks(books);

    return (
        <div className="flex flex-col gap-4">
            {shelves.map((shelf) => (
                <div key={shelf.label}>
                    <Typography className={`${shelf.color} mb-2 ml-1`} sx={{ fontSize: { xs: '11px', sm: '13px' }, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {shelf.label}
                    </Typography>
                    <div className="relative rounded-lg p-3 pb-4" style={{ backgroundColor: "rgba(20,15,10,0.6)" }}>
                        <div className="flex flex-wrap gap-1">
                            {shelf.books.map((book) => (
                                <BookSpine book={book} key={book.id} />
                            ))}
                        </div>
                        {/* Shelf edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-[6px] rounded-b-lg bg-gradient-to-b from-amber-900/40 to-amber-950/60" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Table;
