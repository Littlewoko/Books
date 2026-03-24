interface Props {
    defaultQuery?: string
}

export default function SearchBar({ defaultQuery = '' }: Props) {
    return (
        <form action='/books'>
            <div className="flex items-center gap-2 px-1">
                <input
                    id="query"
                    name="query"
                    max={255}
                    placeholder="Search the catalogue…"
                    defaultValue={defaultQuery}
                    className="flex-1 bg-transparent border-0 border-b border-stone-500 text-stone-800 p-0 focus:outline-none focus:border-amber-700 placeholder-stone-500"
                    style={{ fontFamily: 'var(--font-caveat)', fontSize: '16px', lineHeight: '20px' }}
                />
                <button
                    type="submit"
                    className="text-amber-800 hover:text-amber-900 transition-colors p-0 m-0 border-0 bg-transparent cursor-pointer shrink-0"
                    style={{ fontFamily: 'var(--font-caveat)', fontSize: '15px', lineHeight: '20px' }}
                >
                    Search
                </button>
            </div>
        </form>
    )
}
