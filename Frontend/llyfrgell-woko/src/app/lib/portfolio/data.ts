import { sql, QueryResult, QueryResultRow } from "@vercel/postgres";
import { Portfolio } from "../classes/portfolio";

export function convertToPortfolio(result: QueryResult<QueryResultRow>): Portfolio[] {
    const portfolios = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.url,
        userId: row.user_id,
        description: row.description,
        svgIcon: row.svg_icon
      }));

    return portfolios;
}


export async function fetchUserPortfolio(userId: string) {
    const result = await sql`SELECT * FROM portfolio WHERE user_id=${userId};`;

    return convertToPortfolio(result);
}