import { sql } from "@vercel/postgres";
import { Portfolio } from "./lib/classes/portfolio";
import { fetchUserPortfolio } from "./lib/portfolio/data";
import { getServerSession } from "next-auth";
import PortfolioComponent from "./ui/portfolio/portfolioCards";

export default async function Home() {
  const session = await getServerSession();

  let inProgressCount = 0;
  let completedTotalCount = 0;
  let completedThisYearCount = 0;

  let shortStoriesThisYearcount = 0;
  let shortStoriesAllTimeCount = 0;
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
    inProgressCount = inprogress;
    completedTotalCount = completedcount;
    completedThisYearCount = completedthisyearcount;
    shortStoriesAllTimeCount = shortstorycount;
    shortStoriesThisYearcount = shortstorythisyearcount;
  } catch (error) {
    console.log(error);
  }

  let portfolio: Portfolio[] = [];
  const userId = session?.user?.email ? session.user.email : "watkinsbradley01@gmail.com";

  if (session && session.user && session.user.email) {
    portfolio = await fetchUserPortfolio(session.user.email);
  } else {
    portfolio = await fetchUserPortfolio(userId);

  }

console.log(userId);
  return (
    <div className="px-2">
      <p className="my-4 text-lg text-gray-500 dark:text-amber-500">
        A life without books is a life not lived. - Jay Kristoff
      </p>

      <p>
        in progress: {inProgressCount}
      </p>

      <p>
        Books read all time: {completedTotalCount}
      </p>

      <p>
        Short stories read all time: {shortStoriesAllTimeCount}
      </p>
      <p>
        Books read this year: {completedThisYearCount}
      </p>

      <p>
        Short stories read this year: {shortStoriesThisYearcount}
      </p>

      <PortfolioComponent portfolio={portfolio} userId={userId} />
    </div>
  )
}
