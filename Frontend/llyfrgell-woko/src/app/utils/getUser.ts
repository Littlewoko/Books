import {sql} from "@vercel/postgres";
import crypto from "crypto";

interface ProviderUser {
    id: string;
}

export default async function getUser(user: ProviderUser, provider: string = "github") {
    try {
        const hash = crypto.createHash("sha256").update(user.id).digest("hex");
        const result = await sql`
            SELECT u.*
            FROM users u
                     JOIN user_provider up ON up.user_id = u.id
            WHERE up.provider = ${provider}
              AND up.provider_id_hash = ${hash};
        `;
        return result.rows[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}
