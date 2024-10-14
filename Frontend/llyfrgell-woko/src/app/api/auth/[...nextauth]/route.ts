import GitHubProvider from "next-auth/providers/github";
import NextAuth from "next-auth";
import getUser from "@/app/lib/utils/getUser";

export const authOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID ?? "",
            clientSecret: process.env.GITHUB_SECRET ?? ""
        })
    ],
    callbacks: {
        async signIn({ user }) {
            const userInDb = await getUser(user);
            if (userInDb) {
                return true
            }

            return false;
        }
    }
}

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };