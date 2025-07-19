import { QueryResult, QueryResultRow } from "@vercel/postgres";
import { Portfolio } from "../classes/portfolio";

export async function convertToPortfolio(result: QueryResult<QueryResultRow>): Portfolio[] {
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