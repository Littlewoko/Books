import { Portfolio } from "@/app/lib/classes/portfolio";
import PortfolioCard from "./portfolioCard";
import Header from "../books/header";

interface Props {
    portfolio: Portfolio[]
}

export default function PortfolioComponent({ portfolio }: Props) {
    const portfolioCardItems = portfolio.map((folio) => (
        <PortfolioCard portfolioItem={folio} key={folio.id} />
    ));

    return (
        <div className="flex flex-col m-1 gap-y-1">
            <Header text="Other Projects" colour="text-orange-500" />
            {portfolioCardItems}
        </div>
    );
}