'use client'

import { Portfolio } from "./lib/classes/portfolio";
import { fetchUserPortfolio } from "./lib/portfolio/data";
import { getServerSession } from "next-auth";
import PortfolioComponent from "./ui/portfolio/portfolioCards";
import { getStats } from "./utils/getStats";
import StatsCard from "./ui/books/stats-card";
import Header from "./ui/books/header";
import SearchBar from "./ui/searchbar";

export default async function Home() {
  const session = await getServerSession();

  const stats = await getStats();

  let portfolio: Portfolio[] = [];
  const userId = session?.user?.email ? session.user.email : "watkinsbradley01@gmail.com";

  if (session && session.user && session.user.email) {
    portfolio = await fetchUserPortfolio(session.user.email);
  } else {
    portfolio = await fetchUserPortfolio(userId);

  }

  return (
    <div className="px-2">
      <div className="m-1 flex flex-col gap-1">
        <SearchBar />
        <Header text="A life without books is a life not lived - Jay Kristoff" colour="text-orange-500" />
      </div>
      <StatsCard stats={stats} />
      <PortfolioComponent portfolio={portfolio} userId={userId} />
    </div>
  )
}
