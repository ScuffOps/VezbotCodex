import { getGuildIconUrl } from '@/lib/discord';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { DashboardNav } from './nav';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { guildId: string };
}) {
  const { guild } = await requireManageableGuildAccess(params.guildId);

  return (
    <div className="min-h-screen flex">
      <aside className="w-72 border-r border-border bg-surface/50 backdrop-blur-sm p-4 hidden md:block">
        <DashboardNav
          guildId={params.guildId}
          guildName={guild.name}
          guildIconUrl={getGuildIconUrl(guild)}
        />
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
