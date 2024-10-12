import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl }}) {
            const isLoggedIn = !!auth?.user;
            const isOnBooks = nextUrl.pathname.startsWith('/books');

            if(isOnBooks) {
                if(isLoggedIn) return true;
                else return false;
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/books', nextUrl));
            } else {
                return true;
            }
        }
    },
    pages: {
        signIn: '/login'
    }
} satisfies NextAuthConfig;