'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';

export function LogoLink() {
  const pathname = usePathname();
  const href = pathname.startsWith('/workouts') ? '/workouts' : '/';

  return (
    <Link href={href} className="flex items-center gap-1 text-amber-100/90 hover:text-amber-100 transition-colors" style={{ fontFamily: 'var(--font-caveat)', fontSize: '20px' }}>
      <HomeIcon sx={{ fontSize: 18, color: 'inherit' }} />
      <span className="hidden sm:inline">Adre</span>
    </Link>
  );
}
