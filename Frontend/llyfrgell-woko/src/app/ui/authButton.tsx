import { signIn, signOut, useSession } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

export default function AuthButton() {
    const { data: session } = useSession();

    return (
        session ?
            <button onClick={() => signOut()} type="button" className="flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                <LogoutIcon className="md:mr-1" fontSize="small" />
                <span className="hidden md:inline">Allgofnodi</span>
            </button>
            :
            <button onClick={() => signIn()} type="button" className="flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-small rounded-lg text-sm p-1 px-2 md:px-3 text-center text-xs md:text-sm">
                <LoginIcon className="md:mr-1" fontSize="small" />
                <span className="hidden md:inline">Mewngofnodi</span>
            </button>

    )
}