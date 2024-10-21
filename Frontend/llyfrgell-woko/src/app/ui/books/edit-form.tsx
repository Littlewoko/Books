import { Book } from "@/app/lib/classes/book";
import { formatDateForDatePicker } from "@/app/utils/formatDate";
import { UpdateBook } from "@/app/lib/books/actions";

interface Props {
    book: Book | undefined
}

const Form: React.FC<Props> = ({ book }) => {
    if(!book || !book.id) { 
        return (
            <>
                No such book
            </>
        )
    }
    const updateBookWithId = UpdateBook.bind(null, book.id.toString());
    return (
        <form action={updateBookWithId}>
            <div>
                <label htmlFor="title">
                    Title
                </label>
                <input
                    id="title"
                    name="title"
                    defaultValue={book.title}
                    max={255}
                    placeholder="Please enter book title"
                    required
                />
            </div>
            <div>
                <label htmlFor="author">
                    Author
                </label>
                <input 
                    id="author"
                    name="author"
                    defaultValue={book.author}
                    max={255}
                    placeholder="Please enter the author's name"
                    required
                />
            </div>
            <div>
                <label htmlFor="genre">
                    Genre
                </label>
                <input 
                    id="genre"
                    name="genre"
                    defaultValue={book.genre}
                    max={255}
                    placeholder="Please enter the book's genre"
                    required
                />
            </div>
            <div>
                <label htmlFor="isbn">
                    (optional) isbn
                </label>
                <input 
                    id="isbn"
                    name="isbn"
                    defaultValue={book.isbn ? book.isbn : ""}
                    max={13}
                    placeholder="enter the book's isbn number"
                />
            </div>
            <div>
                <label htmlFor="dateobtained">
                    (optional) Date Obtained
                </label>
                <input 
                    type="date"
                    id="dateobtained"
                    name="dateobtained"
                    defaultValue={book.dateObtained ? formatDateForDatePicker(book.dateObtained) : ""}
                />
            </div>
            <div>
                <label htmlFor="datestartedreading">
                    (optional) Date started reading
                </label>
                <input 
                    type="date"
                    id="datestartedreading"
                    name="datestartedreading"
                    defaultValue={book.dateStartedReading ? formatDateForDatePicker(book.dateStartedReading) : ""}
                />
            </div>
            <div>
                <label htmlFor="datecompleted">
                    (optional) Date completed
                </label>
                <input 
                    type="date"
                    id="datecompleted"
                    name="datecompleted"
                    defaultValue={book.dateCompleted ? formatDateForDatePicker(book.dateCompleted) : ""}
                />
            </div>
            <div>
                <label htmlFor="shortStory">
                    Short story?
                </label>
                <input
                    type="checkbox"
                    id="shortStory"
                    name="shortStory"
                    defaultChecked={book.shortStory}
                />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
}

export default Form;