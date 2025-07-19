'use client'

import { Portfolio } from "./lib/classes/portfolio";
import { fetchUserPortfolio } from "./lib/portfolio/actions";
import PortfolioComponent from "./ui/portfolio/portfolioCards";
import { getStats } from "./utils/getStats";
import StatsCard from "./ui/books/stats-card";
import Header from "./ui/books/header";
import SearchBar from "./ui/searchbar";
import { Stats } from "./lib/classes/stats";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();

  const [stats, setStats] = useState<Stats | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);

  useEffect(() => {
    async function handle() {
      const res = await getStats();
      setStats(res);

      if (session.data?.user?.email) {
        const data = await fetchUserPortfolio(session.data.user.email);
        setPortfolio(data);
      }
    }

    handle();
  }, [])

  return (
    <div className="px-2">
      <div className="m-1 flex flex-col gap-1">
        <SearchBar />
        <Header text="A life without books is a life not lived - Jay Kristoff" colour="text-orange-500" />
      </div>
      <StatsCard stats={stats} />
      {session.data?.user?.email && <PortfolioComponent portfolio={portfolio} userId={session.data?.user?.email} />}
    </div>
  )
}
