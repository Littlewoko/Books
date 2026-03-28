'use client'

import { Portfolio } from "../lib/classes/portfolio";
import { fetchUserPortfolio } from "../lib/portfolio/actions";
import PortfolioComponent from "../ui/portfolio/portfolioCards";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Page() {
  const session = useSession();
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);

  useEffect(() => {
    fetchUserPortfolio().then(setPortfolio);
  }, [session]);

  const isLoggedIn = session.status === "authenticated";

  return (
    <main className="max-w-3xl mx-auto p-2">
      <PortfolioComponent portfolio={portfolio} isLoggedIn={isLoggedIn} />
      {isLoggedIn && (
        <div className="flex justify-end mt-3 mr-1">
          <Link
            href="/portfolio/create"
            className="text-stone-300 hover:text-amber-200 transition-colors text-sm"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            + New Project
          </Link>
        </div>
      )}
    </main>
  );
}
