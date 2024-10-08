export type Book = {
    id?: number,
    title: string,
    author: string, 
    genre: string,
    isbn?: string | null, 
    dateObtained?: Date, 
    dateCompleted?: Date, 
    dateStartedReading?: Date, 
    considerTowardsTotalBooksCompleted: boolean, 
}