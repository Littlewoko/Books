'use client'

import { Portfolio } from "../lib/classes/portfolio";
import { fetchUserPortfolio } from "../lib/portfolio/actions";
import PortfolioComponent from "../ui/portfolio/portfolioCards";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function Page() {
  const session = useSession();
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);

  useEffect(() => {
    fetchUserPortfolio().then(setPortfolio);
  }, [session]);

  return (
    <main className="max-w-3xl mx-auto p-2">
      <PortfolioComponent portfolio={portfolio} />
      <div className="flex justify-end m-1 mt-2">
        <Link href="/portfolio/create">
          <button type="button" className="flex items-center text-white bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
            <AddCircleIcon className="md:mr-1" fontSize="small" />
            <span>New Project</span>
          </button>
        </Link>
      </div>
    </main>
  );
}
