export type Book = {
    title: string,
    author: string, 
    genre: string,
    isbn?: string | null, 
    dateObtained?: Date | null, 
    dateCompleted?: Date | null, 
    dateStartedReading?: Date | null, 
    considerTowardsTotalBooksCompleted: boolean
}