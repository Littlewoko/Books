import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

export default async function getUser(user) {
    try {
        const result: QueryResult<QueryResultRow> =
            await sql`SELECT * FROM USERS WHERE id=${user?.id};`;

        return result.rows[0];
    } catch (error) {
        console.log(error);
        return null;
    }

}