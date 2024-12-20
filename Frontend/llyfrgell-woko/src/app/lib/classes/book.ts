export type Book = {
    id?: number,
    title: string,
    author: string, 
    genre: string,
    isbn?: string | null, 
    dateObtained?: Date | null, 
    dateCompleted?: Date | null, 
    dateStartedReading?: Date | null, 
    shortStory: boolean, 
}