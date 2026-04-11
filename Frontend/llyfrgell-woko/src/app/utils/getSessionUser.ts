import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { sql } from "@vercel/postgres";

export async function getSessionUserId(): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    const result = await sql`SELECT id FROM users WHERE email=${session.user.email};`;
    if (!result.rows[0]) {
        throw new Error("User not found");
    }

    return result.rows[0].id.toString();
}
