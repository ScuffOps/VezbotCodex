'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  BarChart3,
  ShieldCheck,
  UsersRound,
  Gavel,
  Bell,
  Twitch,
  Palette,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  status?: 'staged' | 'live';
}

export function DashboardNav({
  guildId,
  guildName,
  guildIconUrl,
}: {
  guildId: string;
  guildName: string;
  guildIconUrl: string;
}) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: `/dashboard/${guildId}`,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Tickets',
      href: `/dashboard/${guildId}/tickets`,
      icon: <Ticket className="w-5 h-5" />,
    },
    {
      label: 'Embeds',
      href: `/dashboard/${guildId}/embeds`,
      icon: <FileText className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Polls',
      href: `/dashboard/${guildId}/polls`,
      icon: <BarChart3 className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Verification',
      href: `/dashboard/${guildId}/verification`,
      icon: <ShieldCheck className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Reaction Roles',
      href: `/dashboard/${guildId}/roles`,
      icon: <UsersRound className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Moderation',
      href: `/dashboard/${guildId}/moderation`,
      icon: <Gavel className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Reminders',
      href: `/dashboard/${guildId}/reminders`,
      icon: <Bell className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Twitch',
      href: `/dashboard/${guildId}/twitch`,
      icon: <Twitch className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Branding',
      href: `/dashboard/${guildId}/branding`,
      icon: <Palette className="w-5 h-5" />,
      status: 'live',
    },
    {
      label: 'Settings',
      href: `/dashboard/${guildId}/settings`,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="flex flex-col h-full">
      <Link
        href="/guilds"
        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        All Servers
      </Link>

      <div className="glass-panel-sm p-3 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
            {guildIconUrl ? (
              <Image src={guildIconUrl} alt={guildName} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{guildName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Guild</p>
            <h2 className="font-semibold text-sm truncate">{guildName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-bold text-white">VF</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Vezbot_FIN</h3>
            <p className="text-xs text-muted">Control plane</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-white hover:bg-surface-elevated'
                }
              `}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.status ? (
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                  {item.status}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-error transition-colors mt-4"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </nav>
  );
}
