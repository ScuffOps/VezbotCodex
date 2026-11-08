import { Save, Trash2 } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { formatDashboardDate } from '@/lib/dashboard-data';
import { createReminderAction, deleteReminderAction, setReminderSentAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  };
}

export default async function RemindersPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const reminders = await prisma.reminder.findMany({
    where: { guildId: params.guildId },
    orderBy: [{ sent: 'asc' }, { remindAt: 'asc' }],
    take: 100,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Reminders</h1>
        <p className="text-muted-foreground">
          Create and manage guild-scoped reminder records that the bot scheduler can process.
        </p>
      </div>

      <Notice
        created={searchParams?.created}
        updated={searchParams?.updated}
        deleted={searchParams?.deleted}
        error={searchParams?.error}
      />

      <form action={createReminderAction.bind(null, params.guildId)} className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Create reminder</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Reminder records save immediately in the shared database and stay scoped to this guild.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium mb-2">Target user ID</label>
            <input
              id="userId"
              name="userId"
              type="text"
              placeholder="123456789012345678"
              className="input"
              inputMode="numeric"
              pattern="\d{17,20}"
              required
            />
          </div>
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium mb-2">Channel ID (optional)</label>
            <input
              id="channelId"
              name="channelId"
              type="text"
              placeholder="123456789012345678"
              className="input"
              inputMode="numeric"
              pattern="\d{17,20}"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="message" className="block text-sm font-medium mb-2">Reminder message</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="input resize-none"
              maxLength={2000}
              placeholder="Don't forget tonight's launch check-in."
              required
            />
          </div>
          <div>
            <label htmlFor="remindAt" className="block text-sm font-medium mb-2">Remind at</label>
            <input id="remindAt" name="remindAt" type="datetime-local" className="input" required />
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-2">Timezone label</label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              className="input"
              defaultValue="UTC"
              maxLength={80}
              placeholder="America/Los_Angeles"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save reminder
          </SubmitButton>
        </div>
      </form>

      {reminders.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground animate-fade-in">
          No reminders found for this guild.
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder, index) => (
            <div
              key={reminder.id}
              className="glass-panel p-6 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold">User {reminder.userId}</p>
                  <p className="text-xs text-muted">
                    Created {formatDashboardDate(reminder.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${statusTone(reminder.sent)}`}>
                  {reminder.sent ? 'sent' : 'pending'}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-surface/60 px-4 py-4 mb-4">
                <p className="text-xs uppercase tracking-[0.14em] text-primary mb-2">Message</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reminder.message}</p>
              </div>

              <div className="grid gap-2 text-xs text-muted mb-4 md:grid-cols-3">
                <p>Remind at: {formatDashboardDate(reminder.remindAt)}</p>
                <p>Timezone: {reminder.timezone}</p>
                <p>Channel: {reminder.channelId ?? 'DM/default'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {reminder.sent ? (
                  <form action={setReminderSentAction.bind(null, params.guildId)}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <input type="hidden" name="sent" value="false" />
                    <button className="btn btn-secondary" type="submit">Mark pending</button>
                  </form>
                ) : (
                  <form action={setReminderSentAction.bind(null, params.guildId)}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <input type="hidden" name="sent" value="true" />
                    <button className="btn btn-secondary" type="submit">Mark sent</button>
                  </form>
                )}
                <form action={deleteReminderAction.bind(null, params.guildId)} className="ml-auto">
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <button className="btn btn-secondary text-error" type="submit">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({
  created,
  updated,
  deleted,
  error,
}: {
  created?: string;
  updated?: string;
  deleted?: string;
  error?: string;
}) {
  if (created === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Reminder created.
      </div>
    );
  }

  if (updated === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Reminder updated.
      </div>
    );
  }

  if (deleted === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning animate-fade-in">
        Reminder deleted.
      </div>
    );
  }

  if (error) {
    if (error === 'not_found') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          Reminder not found for this guild.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid reminder payload. Verify user/channel IDs and schedule a future time.
      </div>
    );
  }

  return null;
}

function statusTone(sent: boolean) {
  return sent
    ? 'border-success/40 bg-success/10 text-success'
    : 'border-warning/40 bg-warning/10 text-warning';
}
