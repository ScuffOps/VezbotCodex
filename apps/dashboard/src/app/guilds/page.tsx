import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DiscordGuildFetchError, getBotInviteUrl, getManageableGuilds, type DiscordGuild } from '@/lib/discord';
import { GuildList } from './guild-list';

export default async function GuildsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || session.authError) {
    redirect('/login');
  }

  let manageableGuilds: DiscordGuild[] = [];
  let unavailable = false;
  try {
    manageableGuilds = await getManageableGuilds(session.accessToken);
  } catch (error) {
    if (!(error instanceof DiscordGuildFetchError)) throw error;
    if (error.status === 401) redirect('/login?error=session_expired');
    unavailable = true;
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <p className="text-xs uppercase tracking-[0.24em] text-primary mb-3">Guild access</p>
          <h1 className="text-3xl font-bold mb-2">Select a server</h1>
          <p className="text-muted-foreground">
            Only guilds where you have Manage Server or Administrator permissions are shown here.
          </p>
        </div>

        <GuildList guilds={manageableGuilds} />

        {unavailable ? (
          <div role="alert" className="glass-panel p-8 text-center mt-6">
            <p className="text-muted-foreground mb-4">Discord is temporarily unable to return your servers. Please wait a moment and retry.</p>
            <a href="/guilds" className="btn btn-secondary">Retry server list</a>
          </div>
        ) : manageableGuilds.length === 0 ? (
          <div className="glass-panel p-8 text-center animate-fade-in mt-6">
            <p className="text-muted-foreground mb-4">
              No eligible servers were returned by Discord for this account.
            </p>
            <p className="text-sm text-muted mb-4">
              If you just invited the bot or changed permissions, re-authenticate once so Discord refreshes your guild list.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="/login" className="btn btn-secondary">
                Re-authenticate
              </a>
              <a
                href={getBotInviteUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Add Vezbot_FIN to a server
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
