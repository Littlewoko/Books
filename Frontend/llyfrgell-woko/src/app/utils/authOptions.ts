import GitHubProvider from "next-auth/providers/github";
import {AuthOptions} from "next-auth";
import {sql} from "@vercel/postgres";
import crypto from "crypto";

function hashProviderId(id: string): string {
    return crypto.createHash("sha256").update(id).digest("hex");
}

export const authOptions: AuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || ""
        })
    ],
    callbacks: {
        async signIn({user, account}) {
            if (!account?.provider || !user.id) return false;

            const hash = hashProviderId(user.id);
            const result = await sql`
                SELECT u.id
                FROM users u
                         JOIN user_provider up ON up.user_id = u.id
                WHERE up.provider = ${account.provider}
                  AND up.provider_id_hash = ${hash};
            `;
            return !!result.rows[0];
        },
        async jwt({token, user, account}) {
            if (user && account) {
                const hash = hashProviderId(user.id);
                const result = await sql`
                    SELECT u.id
                    FROM users u
                             JOIN user_provider up ON up.user_id = u.id
                    WHERE up.provider = ${account.provider}
                      AND up.provider_id_hash = ${hash};
                `;
                if (result.rows[0]) {
                    token.id = result.rows[0].id;
                }
            } else if (!token.id && token.email) {
                const result = await sql`
                    SELECT id FROM users WHERE email = ${token.email};
                `;
                if (result.rows[0]) {
                    token.id = result.rows[0].id;
                }
            }
            return token;
        },
        async session({session, token}) {
            if (token.id && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET
};
