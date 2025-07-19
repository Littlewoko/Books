import SearchIcon from '@mui/icons-material/Search';

interface Props {
    defaultQuery?: string
}

export default function SearchBar({ defaultQuery = '' }: Props) {
    return (
        <form action='/books'>
            <div className="flex gap-2 items-center">
                <input
                    id="query"
                    name="query"
                    max={255}
                    placeholder="Search"
                    required
                    defaultValue={defaultQuery}
                    className="m-0 placeholder-white/80 bg-[rgba(0,0,0,0.5)] text-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-1 dark:focus:ring-primary-500 dark:focus:border-primary-500 text-gray-300"
                />
                <button type="submit" className="flex items-center text-white bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                    <SearchIcon className="md:mr-1" fontSize="small" />
                    <label htmlFor="query" className="hidden md:inline">Search</label>
                </button>
            </div>
        </form>
    )
}