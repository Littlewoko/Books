import { Book } from "../lib/classes/book";

function getInProgress(books: Book[]): Book[] {
    const inProgress = books.filter(book => {
        if(book.dateCompleted) return false;
        return !!book.dateStartedReading;
    })

    return inProgress;
}

function sortInProgress(inProgress: Book[]): Book[] {
    inProgress.sort((a,b) => {
        const dateStartedA = a.dateStartedReading ? new Date(a.dateStartedReading).getTime() : 0;
        const dateStartedB = b.dateStartedReading ? new Date(b.dateStartedReading).getTime() : 0;

        if(dateStartedA !== dateStartedB) return dateStartedA - dateStartedB;
        else return 0;
    })

    return inProgress.reverse();
}

function getCompleted(books: Book[]): Book[] {
    const completed = books.filter(book => {
        return !!book.dateCompleted;
    })

    return completed;
}

function sortCompleted(completed: Book[]): Book[] {
    completed.sort((a,b) => {
        const dateCompletedA = a.dateCompleted ? new Date(a.dateCompleted).getTime() : 0;
        const dateCompletedB = b.dateCompleted ? new Date(b.dateCompleted).getTime() : 0;

        if (dateCompletedA !== dateCompletedB) return dateCompletedA - dateCompletedB;
        else return 0;
    })

    return completed.reverse();
}

function getOwnedButNotStarted(books: Book[]): Book[] {
   const owned = books.filter(book => {
        if(!!book.dateCompleted) return false;
        if(!!book.dateStartedReading) return false;
        return !!book.dateObtained;
   });

   return owned;
}

function sortOwned(owned: Book[]): Book[] {
    owned.sort((a,b) => {
        const dateObtainedA = a.dateObtained ? new Date(a.dateObtained).getTime() : 0;
        const dateObtainedB = b.dateObtained ? new Date(b.dateObtained).getTime() : 0;

        return dateObtainedA - dateObtainedB;
    })

    return owned.reverse();
}

function getNotOwned(books: Book[]): Book[] {
    const notOwned = books.filter(book => {
        if(!!book.dateCompleted) return false;
        if(!!book.dateStartedReading) return false;
        if(!!book.dateObtained) return false;
        return true;
    })

    return notOwned;
}

export function defaultSort(books: Book[]): Book[] {
    const inProgress = getInProgress(books);
    sortInProgress(inProgress);

    const completed = getCompleted(books);
    sortCompleted(completed);

    const owned = getOwnedButNotStarted(books);
    sortOwned(owned);
    
    const notOwned = getNotOwned(books);

    return [...inProgress, ...completed, ...owned, ...notOwned];
}