import Link from 'next/link';
import MobileAuthButton from './mobileAuthButton';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  isOpen: boolean,
  onClose: () => void;
}

const navItems = [
  { href: '/books', label: 'Llyfrgell', icon: LibraryBooksIcon },
  { href: '/books/create', label: 'Llyfr Newydd', icon: AutoStoriesIcon },
  { href: '/books/stats', label: 'Ystadegau', icon: BarChartIcon },
  { href: '/workouts', label: 'Ymarfer', icon: FitnessCenterIcon },
  { href: '/portfolio', label: 'Portffolio', icon: WorkIcon },
];

const MobileDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{
        backgroundColor: '#f5f0e1',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #c9b99a40 39px, #c9b99a40 40px)',
      }}
    >
      {/* Red margin line */}
      <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-rose-400/50" />

      <button className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 transition-colors z-10" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 28 }} />
      </button>

      <ul className="absolute left-16" style={{ top: '200px' }}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href} style={{ height: '40px' }}>
            <Link href={href} onClick={onClose} className="flex items-center gap-2 text-stone-700 hover:text-amber-800 transition-colors" style={{ fontFamily: 'var(--font-caveat)', fontSize: '24px', lineHeight: '40px' }}>
              <Icon sx={{ fontSize: 20, color: 'inherit' }} />
              {label}
            </Link>
          </li>
        ))}
        <li style={{ height: '40px' }}>
          <MobileAuthButton onClose={onClose} />
        </li>
      </ul>
    </div>
  );
}

export {
  MobileDrawer
}
