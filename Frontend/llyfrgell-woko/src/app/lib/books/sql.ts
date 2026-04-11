import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

export async function GetBooksRequest(
    offset: number,
    limit: number,
    search?: string,
    filters?: {
        shortStory?: boolean | null;
        audiobook?: boolean | null;
        genre?: string;
        status?: string;
        year?: number;
    }
): Promise<QueryResult<QueryResultRow>> {
    let query = `
        SELECT * FROM books WHERE 1=1
    `;
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;

    if (search) {
        query += ` AND (LOWER(title) LIKE $${paramIndex}`;
        query += ` OR LOWER(genre) LIKE $${paramIndex}`;
        query += ` OR LOWER(author) LIKE $${paramIndex})`;
        params.push(`%${search.toLowerCase()}%`);
        paramIndex++;
    }

    if (filters?.shortStory !== undefined && filters.shortStory !== null) {
        query += ` AND shortstory = $${paramIndex}`;
        params.push(filters.shortStory);
        paramIndex++;
    }

    if (filters?.audiobook !== undefined && filters.audiobook !== null) {
        query += ` AND audiobook = $${paramIndex}`;
        params.push(filters.audiobook);
        paramIndex++;
    }

    if (filters?.genre) {
        query += ` AND LOWER(genre) = $${paramIndex}`;
        params.push(filters.genre.toLowerCase());
        paramIndex++;
    }

    if (filters?.status) {
        if (filters.status === 'completed') {
            query += ` AND datecompleted IS NOT NULL`;
        } else if (filters.status === 'in-progress') {
            query += ` AND datestartedreading IS NOT NULL AND datecompleted IS NULL`;
        } else if (filters.status === 'owned') {
            query += ` AND dateobtained IS NOT NULL AND datestartedreading IS NULL`;
        } else if (filters.status === 'not-owned') {
            query += ` AND dateobtained IS NULL`;
        }
    }

    if (filters?.year) {
        query += ` AND EXTRACT(YEAR FROM datecompleted) = $${paramIndex}`;
        params.push(filters.year);
        paramIndex++;
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
        OFFSET $${paramIndex} LIMIT $${paramIndex + 1};
    `;

    params.push(offset, limit);

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