import GitHubProvider from "next-auth/providers/github";
import {AuthOptions} from "next-auth";
import {sql, withTransaction} from "@/app/lib/db";
import crypto from "crypto";

function hashProviderId(id: string): string {
    return crypto.createHash("sha256").update(id).digest("hex");
}

async function createDevelopmentProviderLink(provider: string, providerIdHash: string, email?: string | null) {
    return withTransaction(async client => {
        const user = await client.query(
            "INSERT INTO users (email) VALUES ($1) RETURNING id",
            [email ?? null],
        );
        const userId = user.rows[0].id as string;
        const link = await client.query(
            `INSERT INTO user_provider (user_id, provider, provider_id_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (provider, provider_id_hash) DO NOTHING
             RETURNING user_id`,
            [userId, provider, providerIdHash],
        );

        if (link.rows[0]) return link.rows[0].user_id as string;

        await client.query("DELETE FROM users WHERE id = $1", [userId]);
        const existing = await client.query(
            `SELECT user_id FROM user_provider
             WHERE provider = $1 AND provider_id_hash = $2`,
            [provider, providerIdHash],
        );
        if (!existing.rows[0]) throw new Error("Could not create development provider link");
        return existing.rows[0].user_id as string;
    });
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
            if (result.rows[0]) return true;
            if (process.env.NODE_ENV !== "development") return false;

            await createDevelopmentProviderLink(account.provider, hash, user.email);
            return true;
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
