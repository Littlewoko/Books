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
import dynamic from "next/dynamic";

const GradioSpace = dynamic(
  () => import('./ui/gradioSpace'),
  {
      ssr: false,
      loading: () => <p>Loading chat...</p>, // Optional loading state while the component is being fetched
  }
);

export default function Home() {
  const session = useSession();

  const [stats, setStats] = useState<Stats | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);

  useEffect(() => {
    async function handle() {
      const res = await getStats();
      setStats(res);

      const data = await fetchUserPortfolio();
      setPortfolio(data);
    }

    handle();
  }, [session])

  return (
    <div className="px-2">
      <div className="m-1 flex flex-col gap-1">
        <SearchBar />
        <Header text="A life without books is a life not lived - Jay Kristoff" colour="text-orange-500" />
      </div>
      <StatsCard stats={stats} />
      <div className="m-1 flex flex-col gap-1">
        <Header text="Chat below with Dracula to learn more about Bradley, his career, and his reading habits. Keep scrolling to find notable projects!" colour="text-white" />
      </div>
      <GradioSpace />
      <PortfolioComponent portfolio={portfolio}/>
    </div>
  )
}
