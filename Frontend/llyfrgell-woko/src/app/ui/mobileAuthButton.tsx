import { signIn, signOut, useSession } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

interface Props {
    onClose?: () => void;
}

const linkClass = "flex items-center gap-2 text-stone-700 hover:text-amber-800 transition-colors";
const linkStyle: React.CSSProperties = { fontFamily: 'var(--font-caveat)', fontSize: '24px', lineHeight: '40px' };

export default function MobileAuthButton({ onClose }: Props) {
    const { data: session } = useSession();

    if (session) {
        return (
            <button onClick={() => { signOut(); onClose?.(); }} className={linkClass} style={linkStyle}>
                <LogoutIcon sx={{ fontSize: 20, color: 'inherit' }} />
                Allgofnodi
            </button>
        );
    }

    return (
        <button onClick={() => { signIn(); onClose?.(); }} className={linkClass} style={linkStyle}>
            <LoginIcon sx={{ fontSize: 20, color: 'inherit' }} />
            Mewngofnodi
        </button>
    );
}
