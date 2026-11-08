import { Save, Trash2 } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { formatDashboardDate } from '@/lib/dashboard-data';
import { createPollAction, deletePollAction, setPollStatusAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  };
}

export default async function PollsPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);
  const polls = await prisma.poll.findMany({
    where: { guildId: params.guildId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Polls</h1>
        <p className="text-muted-foreground">
          Draft, activate, and track guild polls from one control surface.
        </p>
      </div>

      <Notice
        created={searchParams?.created}
        updated={searchParams?.updated}
        deleted={searchParams?.deleted}
        error={searchParams?.error}
      />

      <form action={createPollAction.bind(null, params.guildId)} className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Create poll</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Poll records are persisted immediately and can be toggled between draft, active, and closed states.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="question" className="block text-sm font-medium mb-2">Question</label>
            <input id="question" name="question" type="text" className="input" maxLength={300} required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="options" className="block text-sm font-medium mb-2">Options (one per line)</label>
            <textarea
              id="options"
              name="options"
              rows={5}
              className="input resize-none"
              placeholder={'Yes\nNo\nMaybe'}
              required
            />
          </div>
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium mb-2">Target channel ID</label>
            <input id="channelId" name="channelId" type="text" className="input" placeholder="123456789012345678" inputMode="numeric" pattern="\d{17,20}" />
          </div>
          <div>
            <label htmlFor="closesAt" className="block text-sm font-medium mb-2">Closes at (optional)</label>
            <input id="closesAt" name="closesAt" type="datetime-local" className="input" />
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
            <input type="checkbox" name="allowMulti" className="mt-1 h-4 w-4 accent-[var(--primary)]" />
            <span>
              <span className="block font-medium">Allow multi-select</span>
              <span className="block text-sm text-muted-foreground">Users can choose more than one option.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
            <input type="checkbox" name="anonymous" className="mt-1 h-4 w-4 accent-[var(--primary)]" />
            <span>
              <span className="block font-medium">Anonymous</span>
              <span className="block text-sm text-muted-foreground">Hide voter identities in downstream renderers.</span>
            </span>
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Create poll
          </SubmitButton>
        </div>
      </form>

      {polls.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground animate-fade-in">
          No polls created yet.
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, index) => {
            const options = parseOptionsJson(poll.optionsJson);
            return (
              <div
                key={poll.id}
                className="glass-panel p-6 animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold">{poll.question}</h3>
                    <p className="text-xs text-muted">
                      Created {formatDashboardDate(poll.createdAt)} • {options.length} option(s)
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.12em] ${statusTone(poll.status)}`}>
                    {poll.status}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface/60 px-4 py-4 mb-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary mb-2">Options</p>
                  <p className="text-sm text-muted-foreground">{options.join(' • ')}</p>
                </div>

                <div className="grid gap-2 text-xs text-muted mb-4 md:grid-cols-4">
                  <p>Allow multi: {poll.allowMulti ? 'yes' : 'no'}</p>
                  <p>Anonymous: {poll.anonymous ? 'yes' : 'no'}</p>
                  <p>Channel: {poll.channelId ?? 'not set'}</p>
                  <p>Closes: {poll.closesAt ? formatDashboardDate(poll.closesAt) : 'not set'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={setPollStatusAction.bind(null, params.guildId)}>
                    <input type="hidden" name="pollId" value={poll.id} />
                    <input type="hidden" name="status" value="DRAFT" />
                    <button className="btn btn-secondary" type="submit">Set draft</button>
                  </form>
                  <form action={setPollStatusAction.bind(null, params.guildId)}>
                    <input type="hidden" name="pollId" value={poll.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <button className="btn btn-secondary" type="submit">Set active</button>
                  </form>
                  <form action={setPollStatusAction.bind(null, params.guildId)}>
                    <input type="hidden" name="pollId" value={poll.id} />
                    <input type="hidden" name="status" value="CLOSED" />
                    <button className="btn btn-secondary" type="submit">Set closed</button>
                  </form>
                  <form action={deletePollAction.bind(null, params.guildId)} className="ml-auto">
                    <input type="hidden" name="pollId" value={poll.id} />
                    <button className="btn btn-secondary text-error" type="submit">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
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
        Poll created.
      </div>
    );
  }

  if (updated === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Poll status updated.
      </div>
    );
  }

  if (deleted === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning animate-fade-in">
        Poll deleted.
      </div>
    );
  }

  if (error) {
    if (error === 'not_found') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          Poll not found for this guild.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid poll payload. Ensure at least two unique options and a future close date if set.
      </div>
    );
  }

  return null;
}

function parseOptionsJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, 10);
  } catch {
    return [];
  }
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'border-success/40 bg-success/10 text-success';
  if (status === 'CLOSED') return 'border-warning/40 bg-warning/10 text-warning';
  return 'border-border bg-surface text-muted-foreground';
}
