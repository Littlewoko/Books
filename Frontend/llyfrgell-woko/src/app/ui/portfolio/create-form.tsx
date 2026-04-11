'use client'

import {createPortfolio} from "@/app/lib/portfolio/actions";

export default function Form() {
    return (
        <form action={createPortfolio}>
            <div className="rounded-sm bg-stone-900/60 border border-stone-700/40 p-4 flex flex-col gap-4">
                <div>
                    <label htmlFor="title" className="text-stone-400 text-xs">Title</label>
                    <input
                        id="title" name="title" max={255} placeholder="Title" required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="url" className="text-stone-400 text-xs">URL</label>
                    <input
                        id="url" name="url" max={255} placeholder="url" required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-200/80 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="text-stone-400 text-xs">Description</label>
                    <input
                        id="description" name="description" max={255} placeholder="Description" required
                        className="w-full bg-transparent border-b border-stone-600 text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    />
                </div>
                <div>
                    <label htmlFor="svg-icon" className="text-stone-400 text-xs">Inline SVG Icon</label>
                    <textarea
                        id="svg-icon" name="svg-icon" placeholder="SVG Icon" rows={5} required
                        className="w-full bg-transparent border border-stone-600 rounded-sm text-amber-100/90 text-sm p-1 focus:outline-none focus:border-amber-700 placeholder-stone-500 resize-none"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="text-stone-300 hover:text-amber-200 transition-colors text-sm"
                        style={{fontFamily: 'var(--font-caveat)'}}
                    >
                        + Create
                    </button>
                </div>
            </div>
        </form>
    );
}
