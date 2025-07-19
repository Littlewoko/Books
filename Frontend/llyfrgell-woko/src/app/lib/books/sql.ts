import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

export async function GetBooksRequest(
    offset: number,
    limit: number,
    search?: string
): Promise<QueryResult<QueryResultRow>> {
    let query = `
        SELECT * FROM books
    `;
    const params: (string | number)[] = [];

    if (search) {
        query += ` WHERE (LOWER(title) LIKE $1`;
        query += ` OR LOWER(genre) LIKE $1`;
        query += ` OR LOWER(author) LIKE $1)`;
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
    let query = "SELECT CEILING(COUNT(*)::numeric / $1) as count FROM books";
    const params: (string | number)[] = [pageSize];

    if (search) {
        query += ` WHERE (LOWER(title) LIKE $2`;
        query += ` OR LOWER(genre) LIKE $2`;
        query += ` OR LOWER(author) LIKE $2)`;
        params.push(`%${search.toLowerCase()}%`);
    }

    query += ";";

    return sql.query(query, params);

}

export async function GetStatsRequest() {
    const currentYear = new Date().getFullYear();
    const params: (string | number)[] = [currentYear];

    const query = `
        WITH counts AS (
            SELECT 
                COUNT(id) FILTER (WHERE datestartedreading IS NOT NULL AND datecompleted IS NULL) AS inProgress,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = false) AS completedCount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = true) AS shortstorycount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = $1 AND shortstory = false) AS completedthisyearcount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = $1 AND shortstory = true) AS shortstorythisyearcount
              FROM books
        )
        SELECT *
        FROM counts;
    `;

    return sql.query(query, params)
}