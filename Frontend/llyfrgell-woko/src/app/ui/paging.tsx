interface Props {
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    pageLimit: number
}

export default function Paging({ page, setPage, pageLimit = 2 }: Props) {
    const decrement = () => {
        if (page == 0) return;

        setPage(page - 1);
    }

    const increment = () => {
        if (page === pageLimit) return;

        setPage(page + 1);
    }

    const getPageNumberCSS = (pageNumber: number) => {
        if (pageNumber === page + 1) {
            return "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        }

        return "relative items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset focus:z-20 focus:outline-offset-0 md:inline-flex";
    }

    const pageNumbers = (): number[] => {
        const displayPage = page + 1;

        if (pageLimit < 2) {
            // If there are less than three pages, return all available pages
            return Array.from({ length: pageLimit }, (_, index) => index + 1);
        }

        if (displayPage === 1) {
            // If the current page is the first page, return the first three pages
            return [1, 2, 3];
        }

        if (displayPage === pageLimit + 1) {
            // If the current page is the last page, return the last three pages
            return [displayPage - 2, displayPage - 1, displayPage];
        }

        // For all other cases, return the current page and its adjacent pages
        return [displayPage - 1, displayPage, displayPage + 1];
    }

    const pageNumberDisplay = () => {
        const arr = pageNumbers();

        return arr.map(num => <button className={getPageNumberCSS(num)} onClick={() => setPage(num - 1)} key={`page-${num-1}`}>{num}</button>)
    }

    return (
        <div className="flex items-center justify-center sm:justify-between px-4 py-3 sm:px-6">
            <div className="hidden sm:flex">

            </div>
            <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                    <a onClick={decrement} className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-gray-300 ring-inset focus:z-20 focus:outline-offset-0 ${page === 0 && 'text-gray-200'}`}>
                        <span className="sr-only">Previous</span>
                        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
                            <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                        </svg>
                    </a>
                    {pageNumberDisplay()}
                    <button onClick={increment} className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-gray-300 ring-inset focus:z-20 focus:outline-offset-0 ${page === pageLimit && 'text-gray-200'}`}>
                        <span className="sr-only">Next</span>
                        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
                            <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    )
}