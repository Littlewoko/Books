import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

export async function GetBooksRequest(offset: number, limit: number): Promise<QueryResult<QueryResultRow>> {
    return sql
    `SELECT * FROM books
    ORDER BY
    CASE
        WHEN dateCompleted IS NULL AND dateStartedReading IS NOT NULL THEN 1
        WHEN dateCompleted IS NOT NULL THEN 2
        WHEN dateCompleted IS NULL AND dateStartedReading IS NULL AND dateObtained IS NOT NULL THEN 3
        ELSE 4
    END,
    CASE
        WHEN dateCompleted IS NULL AND dateStartedReading IS NOT NULL THEN dateStartedReading
        WHEN dateCompleted IS NOT NULL THEN dateCompleted
        WHEN dateCompleted IS NULL AND dateStartedReading IS NULL AND dateObtained IS NOT NULL THEN dateObtained
        ELSE NULL
    END DESC 
    OFFSET ${offset} LIMIT ${limit};`;
}