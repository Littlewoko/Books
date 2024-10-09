import { createBook } from "@/app/lib/books/actions";

export default function Form() {
    return (
        <form action={createBook}>
            <div>
                <label htmlFor="title">
                    Title
                </label>
                <input
                    id="title"
                    name="title"
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
                />
            </div>
            <div>
                <label htmlFor="consider">
                    Once completed, consider towards total?
                </label>
                <input
                    type="checkbox"
                    id="consider"
                    name="consider"
                />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
}