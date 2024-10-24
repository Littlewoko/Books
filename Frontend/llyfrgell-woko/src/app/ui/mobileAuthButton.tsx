import { signIn, signOut, useSession } from "next-auth/react";
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

export default function MobileAuthButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <button onClick={() => signOut()} type="button" className="w-44 flex justify-center flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm p-1 p-3">
                <LogoutIcon className="mr-1" fontSize="small" />
                <span className="inline">Arwyddo allan</span>
            </button>
        )
    } else {
        return (
            <button onClick={() => signIn()} type="button" className="w-44 flex justify-center flex items-center text-white bg-gradient-to-r from-black to-gray-400 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm p-1 p-3">
                <LoginIcon className="mr-1" fontSize="medium" />
                <span className="inline">Arwyddo i mewn</span>
            </button>
        )
    }
}