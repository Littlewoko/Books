'use server';

import { sql } from '@vercel/postgres';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getReadingStats() {
    await ProtectRoute();

    const currentYear = new Date().getFullYear();

    // Overall stats
    const overallStats = await sql`
        SELECT 
            COUNT(*) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = false) as total_completed,
            COUNT(*) FILTER (WHERE datecompleted IS NOT NULL AND shortstory = true) as total_short_stories,
            COUNT(*) FILTER (WHERE datestartedreading IS NOT NULL AND datecompleted IS NULL) as in_progress,
            COUNT(*) FILTER (WHERE dateobtained IS NOT NULL AND datestartedreading IS NULL) as owned_unread,
            COUNT(*) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = ${currentYear} AND shortstory = false) as completed_this_year,
            COUNT(*) FILTER (WHERE datecompleted IS NOT NULL AND EXTRACT(YEAR FROM datecompleted) = ${currentYear} AND shortstory = true) as short_stories_this_year
        FROM books;
    `;

    // Books by year
    const booksByYear = await sql`
        SELECT 
            EXTRACT(YEAR FROM datecompleted) as year,
            COUNT(*) FILTER (WHERE shortstory = false) as books,
            COUNT(*) FILTER (WHERE shortstory = true) as short_stories
        FROM books
        WHERE datecompleted IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM datecompleted)
        ORDER BY year DESC
        LIMIT 10;
    `;

    // Books by month (current year) - full book details
    const booksByMonth = await sql`
        SELECT 
            id,
            title,
            author,
            coverimageurl,
            datecompleted,
            EXTRACT(MONTH FROM datecompleted) as month
        FROM books
        WHERE datecompleted IS NOT NULL 
        AND EXTRACT(YEAR FROM datecompleted) = ${currentYear}
        AND shortstory = false
        ORDER BY datecompleted DESC;
    `;

    // Genre breakdown
    const genreBreakdown = await sql`
        SELECT 
            genre,
            COUNT(*) as count
        FROM books
        WHERE datecompleted IS NOT NULL
        GROUP BY genre
        ORDER BY count DESC
        LIMIT 10;
    `;

    // Average rating
    const avgRating = await sql`
        SELECT AVG(rating) as avg_rating
        FROM books
        WHERE rating IS NOT NULL AND rating > 0;
    `;

    // Top rated books
    const topRated = await sql`
        SELECT title, author, rating
        FROM books
        WHERE rating IS NOT NULL AND rating > 0
        ORDER BY rating DESC, datecompleted DESC
        LIMIT 5;
    `;

    return {
        overall: overallStats.rows[0],
        byYear: booksByYear.rows,
        byMonth: booksByMonth.rows,
        genres: genreBreakdown.rows,
        avgRating: avgRating.rows[0]?.avg_rating || 0,
        topRated: topRated.rows,
    };
}
