import { Save } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import {
  formatDashboardDate,
  getTicketDashboardData,
  getTicketStatusTone,
} from '@/lib/dashboard-data';
import { postTicketPanelAction, saveTicketSettingsAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    error?: string;
    panelPosted?: string;
    panelError?: string;
  };
}

export default async function TicketsPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);
  const { config, stats, recentTickets } = await getTicketDashboardData(params.guildId);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Tickets</h1>
        <p className="text-muted-foreground">
          This page now writes the live ticket-related guild config and shows recent ticket activity from the database.
        </p>
      </div>

      <Notice
        saved={searchParams?.saved}
        error={searchParams?.error}
        panelPosted={searchParams?.panelPosted}
        panelError={searchParams?.panelError}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Open tickets" value={String(stats.openCount)} />
        <StatCard label="Closed tickets" value={String(stats.closedCount)} />
        <StatCard label="Total tickets" value={String(stats.totalCount)} />
      </div>

      <form action={saveTicketSettingsAction.bind(null, params.guildId)} className="space-y-6">
        <section className="glass-panel p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Ticket configuration</h2>
              <p className="text-sm text-muted-foreground">
                These fields are read by the current bot service when ticket channels are created.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              Live
            </span>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer mb-5">
            <input
              type="checkbox"
              name="ticketsEnabled"
              defaultChecked={config.ticketsEnabled}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-medium">Enable tickets</span>
              <span className="block text-sm text-muted-foreground">
                The bot refuses ticket creation when this flag is off.
              </span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField
              name="ticketCategoryId"
              label="Ticket category ID"
              description="Category where new ticket channels should be created."
              defaultValue={config.ticketCategoryId}
            />
            <ReferenceField
              name="ticketLogChannelId"
              label="Ticket log channel ID"
              description="Channel where ticket log embeds should be sent."
              defaultValue={config.ticketLogChannelId}
            />
            <ReferenceField
              name="modRoleId"
              label="Staff role ID"
              description="Role allowed to access and manage ticket channels."
              defaultValue={config.modRoleId}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
            Config saves write directly to the shared guild config, and live panel posting already routes through the bot control API. Channel picking and richer permission validation still need dashboard-side affordances.
          </div>
        </section>

        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '80ms' }}>
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save ticket settings
          </SubmitButton>
        </div>
      </form>

      <form
        action={postTicketPanelAction.bind(null, params.guildId)}
        className="glass-panel p-6 mt-6 animate-fade-in"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold">Post a live ticket panel</h2>
            <p className="text-sm text-muted-foreground">
              This action calls the bot service and posts a real interactive message into Discord.
            </p>
          </div>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            Bot API
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReferenceField
            name="panelChannelId"
            label="Panel channel ID"
            description="Text channel where the ticket panel should be posted."
            defaultValue={null}
          />
          <div>
            <label htmlFor="panelTitle" className="block text-sm font-medium mb-2">
              Panel title
            </label>
            <input
              id="panelTitle"
              name="panelTitle"
              type="text"
              defaultValue="Support Tickets"
              className="input"
              maxLength={80}
            />
            <p className="text-xs text-muted mt-1">Shown as the embed title in Discord.</p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="panelDescription" className="block text-sm font-medium mb-2">
            Panel description
          </label>
          <textarea
            id="panelDescription"
            name="panelDescription"
            rows={4}
            defaultValue="Use the button below to open a ticket and get help from the server team."
            className="input resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-muted mt-1">
            The bot validates the caller and posts a live button that opens the ticket modal.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-secondary">Post ticket panel</SubmitButton>
        </div>
      </form>

      <section className="glass-panel p-6 mt-6 animate-fade-in" style={{ animationDelay: '140ms' }}>
        <h2 className="text-lg font-semibold mb-2">Recent tickets</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Latest persisted ticket records for this guild.
        </p>

        {recentTickets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 px-4 py-8 text-center text-muted-foreground">
            No ticket records exist for this guild yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-border bg-surface/60 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold">Ticket #{ticket.ticketNumber}</p>
                    <p className="text-sm text-muted-foreground">Channel ID: {ticket.channelId}</p>
                  </div>
                  <span className={`text-sm font-medium ${getTicketStatusTone(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <p>Creator: {ticket.creatorId}</p>
                  <p>Created: {formatDashboardDate(ticket.createdAt)}</p>
                  <p>Subject: {ticket.subject ?? 'No subject'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Notice({
  saved,
  error,
  panelPosted,
  panelError,
}: {
  saved?: string;
  error?: string;
  panelPosted?: string;
  panelError?: string;
}) {
  if (saved === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Ticket configuration saved to the shared database.
      </div>
    );
  }

  if (panelPosted === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        The bot posted a live ticket panel message to Discord.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        One or more ticket references were invalid. Use raw Discord snowflake IDs only.
      </div>
    );
  }

  if (panelError) {
    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        The live ticket panel request failed. Check the panel channel ID, bot permissions, and bot API env configuration.
      </div>
    );
  }

  return null;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-5 animate-fade-in">
      <p className="text-xs uppercase tracking-[0.18em] text-primary mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function ReferenceField({
  name,
  label,
  description,
  defaultValue,
}: {
  name: string;
  label: string;
  description: string;
  defaultValue: string | null;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue ?? ''}
        placeholder="123456789012345678"
        className="input"
        inputMode="numeric"
        pattern="\d{17,20}"
      />
      <p className="text-xs text-muted mt-1">{description}</p>
    </div>
  );
}
