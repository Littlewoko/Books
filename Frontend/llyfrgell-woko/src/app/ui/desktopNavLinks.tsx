import Link from 'next/link';
import AuthButton from './authButton';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

const navItems = [
  { href: '/books', label: 'Llyfrgell', icon: LibraryBooksIcon },
  { href: '/books/create', label: 'Llyfr Newydd', icon: AutoStoriesIcon },
  { href: '/books/stats', label: 'Ystadegau', icon: BarChartIcon },
  { href: '/workouts', label: 'Ymarfer', icon: FitnessCenterIcon },
  { href: '/portfolio', label: 'Portffolio', icon: WorkIcon },
];

const linkClass = "flex items-center gap-1 text-amber-100/70 hover:text-amber-100 transition-colors";
const linkStyle = { fontFamily: 'var(--font-caveat)', fontSize: '18px' };

export function DesktopNavLinks() {
  return (
    <ul className="flex flex-row gap-4 items-center">
      {navItems.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link href={href} className={linkClass} style={linkStyle}>
            <Icon sx={{ fontSize: 16, color: 'inherit' }} />
            <span className="hidden md:inline">{label}</span>
          </Link>
        </li>
      ))}
      <li>
        <AuthButton />
      </li>
    </ul>
  );
}
