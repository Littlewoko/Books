"use client";

import {deletePortfolio, editPortfolio} from "@/app/lib/portfolio/actions";
import {Portfolio} from "@/app/lib/classes/portfolio";

interface Props {
    portfolio: Portfolio
}

export default function Form({portfolio}: Props) {
    if (!portfolio || !portfolio.id) {
        return <p className="text-stone-500">No such portfolio item</p>;
    }

    const editPortfolioWithId = editPortfolio.bind(null, portfolio.id);

    const handleDelete = async () => {
        if (!portfolio.id) return;
        const wantToDelete = confirm(`Are you sure you want to delete ${portfolio.title}? This action cannot be undone.`);
        if (!wantToDelete) return;
        await deletePortfolio(portfolio.id.toString());
    };

    return (
        <form action={editPortfolioWithId}>
            <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4 flex flex-col gap-4">
                <div>
                    <label htmlFor="title" className="text-stone-400 text-xs">Title</label>
                    <input
                        id="title" name="title" max={255} placeholder="Title" defaultValue={portfolio.title} required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="url" className="text-stone-400 text-xs">URL</label>
                    <input
                        id="url" name="url" max={255} placeholder="url" defaultValue={portfolio.url} required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-200/80 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="text-stone-400 text-xs">Description</label>
                    <input
                        id="description" name="description" max={255} placeholder="Description"
                        defaultValue={portfolio.description} required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="svg-icon" className="text-stone-400 text-xs">Inline SVG Icon</label>
                    <textarea
                        id="svg-icon" name="svg-icon" placeholder="SVG Icon" rows={5}
                        defaultValue={atob(portfolio.svgIcon)} required
                        className="w-full bg-transparent border border-stone-600 rounded-sm text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500 resize-none"
                    />
                </div>
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-rose-400/60 hover:text-rose-300 transition-colors text-sm"
                        style={{fontFamily: 'var(--font-caveat)'}}
                    >
                        Delete
                    </button>
                    <button
                        type="submit"
                        className="text-stone-300 hover:text-amber-200 transition-colors text-sm"
                        style={{fontFamily: 'var(--font-caveat)'}}
                    >
                        Save
                    </button>
                </div>
            </div>
        </form>
    );
}
