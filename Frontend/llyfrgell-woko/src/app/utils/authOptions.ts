import GitHubProvider from "next-auth/providers/github";
import getUser from "@/app/utils/getUser";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || ""
        })
    ],
    callbacks: {
        async signIn({ user }) {
            const userInDb = await getUser(user);
            return !!userInDb;
        }
    }, 
    secret: process.env.NEXTAUTH_SECRET
}