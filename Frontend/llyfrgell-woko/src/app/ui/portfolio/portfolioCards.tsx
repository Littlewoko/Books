import { Portfolio } from "@/app/lib/classes/portfolio";
import PortfolioCard from "./portfolioCard";
import Header from "../books/header";
import QuickAdd from "../books/quick-add";
import Form from "./create-form";

interface Props {
    portfolio: Portfolio[], 
    userId: string
}

export default function PortfolioComponent({ portfolio, userId }: Props) {
    const portfolioCardItems = portfolio.map((folio) => (
        <PortfolioCard portfolioItem={folio} key={folio.id} />
    ));

    return (
        <div className="flex flex-col m-1 gap-y-1">
            <Header text="Other Projects" colour="text-orange-500" />
            <QuickAdd Form={<Form userId={userId} />}/>
            {portfolioCardItems}
        </div>
    );
}