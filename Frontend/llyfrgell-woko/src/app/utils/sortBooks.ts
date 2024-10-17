import { Book } from "../lib/classes/book";

export function sortBydateStartedReading(books: Book[]): Book[] {
    books.sort((a, b) => {
        const dateStartedA = a.dateStartedReading ? new Date(a.dateStartedReading).getTime() : 0;
        const dateStartedB = b.dateStartedReading ? new Date(b.dateStartedReading).getTime() : 0;

        if (dateStartedA !== dateStartedB) {
            return dateStartedA - dateStartedB;
        }

        const dateCompletedA = a.dateCompleted ? new Date(a.dateCompleted).getTime() : 0;
        const dateCompletedB = b.dateCompleted ? new Date(b.dateCompleted).getTime() : 0;

        if (dateCompletedA !== dateCompletedB) {
            return dateCompletedA - dateCompletedB;
        }

        const dateObtainedA = a.dateObtained ? new Date(a.dateObtained).getTime() : 0;
        const dateObtainedB = b.dateObtained ? new Date(b.dateObtained).getTime() : 0;

        return dateObtainedA - dateObtainedB;
    });

    return books.reverse();
}