'use client'

import { Portfolio } from "@/app/lib/classes/portfolio";
import PortfolioCard from "./portfolioCard";

interface Props {
    portfolio: Portfolio[]
    isLoggedIn?: boolean
}

export default function PortfolioComponent({ portfolio, isLoggedIn }: Props) {
    return (
        <div>
            <h1
                className="text-amber-200/90 text-2xl sm:text-3xl mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: 'var(--font-caveat)' }}
            >
                Projects
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {portfolio.map((folio) => (
                    <PortfolioCard portfolioItem={folio} key={folio.id} isLoggedIn={isLoggedIn} />
                ))}
            </div>
        </div>
    );
}
