import { signIn, signOut, useSession } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

const linkClass = "flex items-center gap-1 text-amber-100/70 hover:text-amber-100 transition-colors";
const linkStyle: React.CSSProperties = { fontFamily: 'var(--font-caveat)', fontSize: '18px' };

export default function AuthButton() {
    const { data: session } = useSession();

    return session ? (
        <button onClick={() => signOut()} className={linkClass} style={linkStyle}>
            <LogoutIcon sx={{ fontSize: 16, color: 'inherit' }} />
            <span className="hidden md:inline">Allgofnodi</span>
        </button>
    ) : (
        <button onClick={() => signIn()} className={linkClass} style={linkStyle}>
            <LoginIcon sx={{ fontSize: 16, color: 'inherit' }} />
            <span className="hidden md:inline">Mewngofnodi</span>
        </button>
    );
}
