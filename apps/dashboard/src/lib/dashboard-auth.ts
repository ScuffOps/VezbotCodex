import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getManageableGuild } from "@/lib/discord";

export async function requireDashboardSession() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect("/login");
  }

  if (session.authError) {
    redirect("/login?error=session_expired");
  }

  return session as typeof session & { accessToken: string };
}

export async function requireManageableGuildAccess(guildId: string) {
  const session = await requireDashboardSession();
  const guild = await getManageableGuild(session.accessToken, guildId);

  if (!guild) {
    redirect("/guilds");
  }

  return { session, guild };
}
