import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';

export function LogoLink() {
  return (
    <Link href="/" className="flex items-center gap-1 text-amber-100/90 hover:text-amber-100 transition-colors" style={{ fontFamily: 'var(--font-caveat)', fontSize: '20px' }}>
      <HomeIcon sx={{ fontSize: 18, color: 'inherit' }} />
      <span className="hidden sm:inline">Adre</span>
    </Link>
  );
}
