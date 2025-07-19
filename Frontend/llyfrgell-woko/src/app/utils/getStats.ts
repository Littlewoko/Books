import { sql } from "@vercel/postgres";
import { Stats } from "../lib/classes/stats";

export async function getStats() {
    let stats: Stats | null = null;
    try {
        const currentYear = new Date().getFullYear();

        const result = await sql`
        WITH counts AS (
            SELECT 
                COUNT(id) FILTER (WHERE datestartedreading IS NOT NULL AND datecompleted IS NULL) AS inProgress,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = false) AS completedCount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = true) AS shortstorycount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = ${currentYear} AND shortstory = false) AS completedthisyearcount,
                COUNT(id) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = ${currentYear} AND shortstory = true) AS shortstorythisyearcount
              FROM books
        )
        SELECT *
        FROM counts;
    `;

        const { inprogress, completedcount, shortstorycount, completedthisyearcount, shortstorythisyearcount } = result.rows[0];
        stats = {
            inProgress: inprogress, 
            allTimeComplete: completedcount, 
            allTimeCompleteShort: shortstorycount, 
            thisYearComplete: completedthisyearcount, 
            thisYearCompleteShort: shortstorythisyearcount
        }
    } catch (error) {
        console.log(error);
    }
    
    return stats;
}