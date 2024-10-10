import { Book } from "../classes/book";

export function getDummyBooks(): Book[] {
    const vampire: Book = {
        author: "Mary Shelley", 
        isbn: "12345678987", 
        title: "vamire book", 
        genre: "horror", 
        considerTowardsTotalBooksCompleted: true
    }

    const book2: Book = {
        author: "Edgar Allen Poe", 
        isbn: "12345678982", 
        title: "book2", 
        genre: "action", 
        dateObtained: new Date(),
        dateCompleted: new Date(),
        dateStartedReading: new Date(),
        considerTowardsTotalBooksCompleted: false
    }

    const book3: Book = {
        author: "John Polidori", 
        isbn: "12345678983", 
        title: "book3", 
        genre: "new genre", 
        considerTowardsTotalBooksCompleted: true
    }

    const book5: Book = {
        author: "H.P. Lovecraft", 
        isbn: "12345678985", 
        title: "book5", 
        genre: "romance", 
        considerTowardsTotalBooksCompleted: true
    }

    return [vampire, book2, book3, book5];
}