import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

interface User {
    id: string
}

export default async function getUser(user: User) {
    try {
        const result: QueryResult<QueryResultRow> =
            await sql`SELECT * FROM USERS WHERE id=${user?.id};`;

        return result.rows[0];
    } catch (error) {
        console.log(error);
        return null;
    }

}