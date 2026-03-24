interface Props {
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    pageLimit: number
}

export default function Paging({ page, setPage, pageLimit = 2 }: Props) {
    const decrement = () => {
        if (page === 1) return;
        setPage(page - 1);
    }

    const increment = () => {
        if (page === pageLimit) return;
        setPage(page + 1);
    }

    const pageNumbers = (): number[] => {
        if (pageLimit < 3) {
            return Array.from({ length: pageLimit }, (_, i) => i + 1);
        }
        if (page === 1) return [1, 2, 3];
        if (page === pageLimit) return [page - 2, page - 1, page];
        return [page - 1, page, page + 1];
    }

    return (
        <div className="flex items-center justify-center sm:justify-between px-4 py-3 sm:px-6">
            <div className="hidden sm:flex" />
            <nav className="flex items-center gap-1" style={{ fontFamily: 'var(--font-caveat)' }} aria-label="Pagination">
                <button
                    onClick={decrement}
                    disabled={page === 1}
                    className={`text-2xl px-2 py-1 transition-colors ${page === 1 ? 'text-stone-300 cursor-default' : 'text-stone-600 hover:text-amber-800'}`}
                    aria-label="Previous page"
                >
                    «
                </button>

                {pageNumbers().map(num => (
                    <button
                        key={`page-${num}`}
                        onClick={() => setPage(num)}
                        className={`text-xl px-1.5 transition-colors ${
                            num === page
                                ? 'text-amber-900 font-bold underline underline-offset-2 decoration-amber-800/50'
                                : 'text-stone-500 hover:text-amber-800'
                        }`}
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={increment}
                    disabled={page === pageLimit}
                    className={`text-2xl px-2 py-1 transition-colors ${page === pageLimit ? 'text-stone-300 cursor-default' : 'text-stone-600 hover:text-amber-800'}`}
                    aria-label="Next page"
                >
                    »
                </button>
            </nav>
        </div>
    )
}
