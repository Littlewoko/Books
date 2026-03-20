export type BookClubNote = {
    id?: number;
    bookId: number;
    question: string;
    answer?: string | null;
    sortOrder: number;
};
