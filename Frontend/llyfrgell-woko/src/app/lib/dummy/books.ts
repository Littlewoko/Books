import { Book } from "../classes/book";

export function getDummyBooks(): Book[] {
    const vampire: Book = {
        author: "123", 
        isbn: "123", 
        title: "vamire book", 
        genre: "horror", 
        considerTowardsTotalBooksCompleted: true
    }

    const book2: Book = {
        author: "123", 
        isbn: "123", 
        title: "book2", 
        genre: "action", 
        considerTowardsTotalBooksCompleted: true
    }

    const book3: Book = {
        author: "123", 
        isbn: "123", 
        title: "book3", 
        genre: "new genre", 
        considerTowardsTotalBooksCompleted: true
    }

    const book5: Book = {
        author: "123", 
        isbn: "123", 
        title: "book5", 
        genre: "romance", 
        considerTowardsTotalBooksCompleted: true
    }

    return [vampire, book2, book3, book5];
}