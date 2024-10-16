import { Book } from "../classes/book";

export function getDummyBooks(): Book[] {
    const vampire: Book = {
        id: 1,
        author: "Mary Shelley", 
        isbn: "12345678987", 
        title: "vamire book", 
        genre: "horror", 
        considerTowardsTotalBooksCompleted: true,
        dateObtained: new Date(),
        dateStartedReading: new Date()
    }

    const book2: Book = {
        id: 2,
        author: "Edgar Allen Poe", 
        isbn: "12345678982", 
        title: "book2kjabsjk b ascjbac n xcibsdvhbxnc shdb vshbc vn sdvjhbsdvibsnv hbsidvbxm cksdbjvilsbdvn xcvkbi", 
        genre: "action", 
        dateObtained: new Date(),
        dateCompleted: new Date(),
        dateStartedReading: new Date(),
        considerTowardsTotalBooksCompleted: false
    }

    const book3: Book = {
        id: 3,
        author: "John Polidori", 
        isbn: "12345678983", 
        title: "book3", 
        genre: "new genre", 
        considerTowardsTotalBooksCompleted: true
    }

    const book5: Book = {
        id: 4,
        author: "H.P. Lovecraft", 
        isbn: "12345678985", 
        title: "book5", 
        genre: "romance", 
        considerTowardsTotalBooksCompleted: true
    }

    return [vampire, book2, book3, book5];
}