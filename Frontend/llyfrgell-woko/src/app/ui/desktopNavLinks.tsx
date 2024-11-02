import Link from 'next/link';
import AuthButton from './authButton';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import HomeIcon from '@mui/icons-material/Home';

export function DesktopNavLinks() {
  return (
    <ul className="flex flex-row gap-2">
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <Link href="/books">
          <button type="button" className="flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
            <LibraryBooksIcon className="md:mr-1" fontSize="small" />
            <span className="hidden md:inline">Llyfrgell</span>
          </button>
        </Link>
      </li>
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <Link href="/books/create">
          <button type="button" className="flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
            <AutoStoriesIcon className="md:mr-1" fontSize="small" />
            <span className="hidden md:inline">Llyfr Newedd</span>
          </button>
        </Link>
      </li>
      <li className="text-xl hover:text-blue-900 hover:font-semibold">
        <AuthButton />
      </li>
    </ul>
  );
}