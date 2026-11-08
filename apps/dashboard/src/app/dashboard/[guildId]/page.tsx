import {
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
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { guildId: string };
}

export default function DashboardOverview({ params }: PageProps) {
  const { guildId } = params;

  const quickActions = [
    {
      label: 'Tickets',
      description: 'Ticket configuration, stats, and live panel posting are available now.',
      href: `/dashboard/${guildId}/tickets`,
      icon: <Ticket className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      status: 'live',
    },
    {
      label: 'Embeds',
      description: 'Build and store reusable embed templates with channel defaults.',
      href: `/dashboard/${guildId}/embeds`,
      icon: <FileText className="w-6 h-6" />,
      color: 'from-orange-500 to-amber-600',
      status: 'live',
    },
    {
      label: 'Polls',
      description: 'Draft, activate, and close polls from one shared dashboard flow.',
      href: `/dashboard/${guildId}/polls`,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      status: 'live',
    },
    {
      label: 'Verification',
      description: 'Configure verification channels, roles, and onboarding messaging.',
      href: `/dashboard/${guildId}/verification`,
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'from-cyan-500 to-sky-600',
      status: 'live',
    },
    {
      label: 'Reaction Roles',
      description: 'Create reaction-role menus and manage option payloads.',
      href: `/dashboard/${guildId}/roles`,
      icon: <UsersRound className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      status: 'live',
    },
    {
      label: 'Moderation',
      description: 'Review moderation history and add dashboard-authored case notes.',
      href: `/dashboard/${guildId}/moderation`,
      icon: <Gavel className="w-6 h-6" />,
      color: 'from-rose-500 to-red-600',
      status: 'live',
    },
    {
      label: 'Reminders',
      description: 'Create, list, and lifecycle-manage guild reminder records for scheduler workflows.',
      href: `/dashboard/${guildId}/reminders`,
      icon: <Bell className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-600',
      status: 'live',
    },
    {
      label: 'Twitch',
      description: 'Configure Twitch watchlists, notification channels, and message template preferences.',
      href: `/dashboard/${guildId}/twitch`,
      icon: <Twitch className="w-6 h-6" />,
      color: 'from-violet-500 to-fuchsia-600',
      status: 'live',
    },
    {
      label: 'Branding',
      description: 'Persist guild branding profile values for copy, color, and media presentation.',
      href: `/dashboard/${guildId}/branding`,
      icon: <Palette className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-600',
      status: 'live',
    },
    {
      label: 'Settings',
      description: 'Guild configuration reads and writes are live against the shared Prisma schema.',
      href: `/dashboard/${guildId}/settings`,
      icon: <Settings className="w-6 h-6" />,
      color: 'from-slate-500 to-slate-600',
      status: 'live',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <p className="text-xs uppercase tracking-[0.24em] text-primary mb-3">Dashboard</p>
        <h1 className="text-3xl font-bold mb-2">Operations overview</h1>
        <p className="text-muted-foreground">
          Core dashboard segments are live across tickets, content modules, moderation tooling, integrations, and scheduler support.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-panel p-5 group hover:border-primary/30 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                {action.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {action.label}
            </h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 glass-panel p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="text-lg font-semibold mb-4">Rollout state</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StateCard label="Dashboard auth" value="Live" description="Discord OAuth and guild filtering are active." />
          <StateCard label="Guild access checks" value="Live" description="Direct dashboard access is blocked unless the user can manage the guild." />
          <StateCard label="Bot control API" value="Live" description="The dashboard can call the bot service for live Discord-side actions such as ticket panels." />
        </div>
      </div>
    </div>
  );
}

function StateCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-surface rounded-xl">
      <p className="text-xs uppercase tracking-[0.18em] text-primary mb-2">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
