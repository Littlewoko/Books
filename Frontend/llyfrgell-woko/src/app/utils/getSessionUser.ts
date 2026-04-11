import {getServerSession} from "next-auth";
import {authOptions} from "./authOptions";

export async function getSessionUserId(): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }
    return session.user.id;
}
