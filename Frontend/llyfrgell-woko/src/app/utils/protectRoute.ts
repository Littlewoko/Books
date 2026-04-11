import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";

export default async function ProtectRoute() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/api/auth/signin");
    }
}
