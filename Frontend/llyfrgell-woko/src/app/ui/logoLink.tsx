import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';

export function LogoLink() {
  return (
    <div className="pl-2 text-center sm:mb-0 flex-grow">
      <Link href="/">
        <button type="button" className="flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
          <HomeIcon className="md:mr-1" fontSize="small" />
          <span className="hidden md:inline">Adre</span>
        </button>
      </Link>
    </div>
  );
}