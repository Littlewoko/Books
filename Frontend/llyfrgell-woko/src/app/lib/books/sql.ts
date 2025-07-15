import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

export async function GetBooksRequest(
    offset: number,
    limit: number,
    search?: string
): Promise<QueryResult<QueryResultRow>> {
    let query = `
        SELECT * FROM books
    `;
    let params: (string | number)[] = [];

    if (search) {
        query += ` WHERE LOWER(title) LIKE $1`;
        params.push(`%${search.toLowerCase()}%`);
    }

    query += `
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
        OFFSET ${offset} LIMIT ${limit};
    `;

    if (search) {
        return sql.query(query, params);
    } else {
        return sql.query(query);
    }
}


export async function GetPageCountRequest(pageSize: number, search?: string) {
 const whereClause = search
        ? "WHERE LOWER(title) LIKE '%" + search.toLowerCase() + "%'"
        : "";
    return "SELECT CEILING(COUNT(*)/" + pageSize + ") FROM books " + whereClause + ";";
}