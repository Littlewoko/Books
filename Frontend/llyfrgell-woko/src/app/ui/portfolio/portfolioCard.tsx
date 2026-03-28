"use client";

import { Portfolio } from "@/app/lib/classes/portfolio";
import { deletePortfolio } from "@/app/lib/portfolio/actions";
import Link from "next/link";

interface props {
    portfolioItem: Portfolio
    isLoggedIn?: boolean
}

export default function PortfolioCard({ portfolioItem, isLoggedIn }: props) {
    const svgString = atob(portfolioItem.svgIcon);

    const Delete = async () => {
        const wantToDelete = confirm(`Are you sure you want to delete ${portfolioItem.title}? This action cannot be undone`);
        if (!wantToDelete) return;
        await deletePortfolio(portfolioItem.id?.toString() ?? "");
    }

    return (
        <div className="group relative rounded-sm overflow-hidden shadow-md shadow-black/40 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/60 bg-gradient-to-b from-stone-700 to-stone-800 flex flex-col">
            {/* Spine edge */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-black/30 z-20" />

            {/* Clickable cover area */}
            <a
                href={portfolioItem.url}
                rel="noopener noreferrer"
                target="_blank"
                className="absolute inset-0 z-10"
            />

            {/* Content laid out like back of a book */}
            <div className="flex flex-col items-center text-center px-4 pt-6 pb-4 flex-1">
                {/* SVG icon */}
                <div
                    className="w-12 h-12 sm:w-16 sm:h-16 mb-3 flex-shrink-0 [&_svg]:w-full [&_svg]:h-full [&_svg]:fill-amber-200/50"
                    dangerouslySetInnerHTML={{ __html: svgString }}
                />

                {/* Title */}
                <p className="text-amber-100/90 text-sm sm:text-base font-semibold leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {portfolioItem.title}
                    <span className="text-stone-400 ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                </p>

                {/* Divider */}
                <div className="w-8 border-t border-amber-100/15 my-3" />

                {/* Description / blurb */}
                <p className="text-stone-300/60 text-[11px] sm:text-xs leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {portfolioItem.description}
                </p>
            </div>

            {/* Actions pinned to bottom */}
            {isLoggedIn && (
                <div className="flex justify-center gap-1 pb-3 px-3 relative z-20">
                    <Link
                        href={`/portfolio/${portfolioItem.id}/edit`}
                        className="relative z-30 text-stone-300/70 hover:text-amber-200 transition-colors text-[11px] py-1.5 px-2"
                    >
                        Edit
                    </Link>
                    <button
                        onClick={Delete}
                        type="button"
                        className="relative z-30 text-rose-300/50 hover:text-rose-300 transition-colors text-[11px] py-1.5 px-2"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}
