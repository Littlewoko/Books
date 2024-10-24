import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import MobileAuthButton from './mobileAuthButton';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
  isOpen: boolean,
  onClose: () => void;
}

const MobileDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed flex flex-col justify-center items-center z-10 top-0 right-0 h-full w-full bg-white text-black transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      <button className="absolute right-4 top-4 p-3" onClick={onClose}>
        <FontAwesomeIcon className="text-3xl" icon={faXmark} />
      </button>
      <ul className="flex flex-col justify-center items-center space-y-4">
        <li className="text-xl hover:text-blue-900 hover:font-semibold">
          <Link href="/">
            <button type="button" onClick={onClose} className="w-44 flex justify-center items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm p-1 p-3">
              <HomeIcon className="mr-1" fontSize="small" />
              <span className="inline">Adre</span>
            </button>
          </Link>
        </li>
        <li className="text-xl hover:text-blue-900 hover:font-semibold">
          <Link href="/books">
            <button type="button" onClick={onClose} className="w-44 flex justify-center flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm p-1 p-3">
              <LibraryBooksIcon className="mr-1" fontSize="small" />
              <span className="inline">Llyfrgell</span>
            </button>
          </Link>
        </li>
        <li className="text-xl hover:text-blue-900 hover:font-semibold">
          <Link href="/books/create">
            <button type="button" onClick={onClose} className="w-44 flex justify-center flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm p-1 p-3">
              <AutoStoriesIcon className="mr-1" fontSize="small" />
              <span className="inline">Llyfr Newedd</span>
            </button>
          </Link>
        </li>
        <li className="text-xl hover:text-blue-900 hover:font-semibold">
          <MobileAuthButton />
        </li>
      </ul>
    </div>
  );
}

export {
  MobileDrawer
}