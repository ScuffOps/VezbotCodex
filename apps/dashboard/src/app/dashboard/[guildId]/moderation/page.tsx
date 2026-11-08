import { Gavel, Save } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { formatDashboardDate } from '@/lib/dashboard-data';
import { createModerationNoteAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    created?: string;
    error?: string;
  };
}

export default async function ModerationPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const cases = await prisma.moderationCase.findMany({
    where: { guildId: params.guildId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Moderation</h1>
        <p className="text-muted-foreground">
          Review moderation cases and add dashboard-authored notes for staff context.
        </p>
      </div>

      <Notice created={searchParams?.created} error={searchParams?.error} />

      <form action={createModerationNoteAction.bind(null, params.guildId)} className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Create moderation note</h2>
        <p className="text-sm text-muted-foreground mb-5">
          This writes a <code className="text-primary">NOTE</code> case to the shared moderation history. No Discord-side punitive action is triggered.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="targetId" className="block text-sm font-medium mb-2">Target user ID</label>
            <input id="targetId" name="targetId" type="text" className="input" placeholder="123456789012345678" inputMode="numeric" pattern="\d{17,20}" required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="reason" className="block text-sm font-medium mb-2">Reason</label>
            <textarea id="reason" name="reason" rows={3} className="input resize-none" maxLength={1000} required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="evidence" className="block text-sm font-medium mb-2">Evidence (optional)</label>
            <textarea id="evidence" name="evidence" rows={3} className="input resize-none" maxLength={4000} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save moderation note
          </SubmitButton>
        </div>
      </form>

      {cases.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground animate-fade-in">
          No moderation cases recorded for this guild yet.
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((moderationCase, index) => (
            <div
              key={moderationCase.id}
              className="glass-panel p-5 animate-fade-in"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Gavel className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-semibold">
                    Case #{moderationCase.caseNumber} • {moderationCase.type}
                  </p>
                </div>
                <p className="text-xs text-muted">{formatDashboardDate(moderationCase.createdAt)}</p>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3 mb-2">
                <p>Target: {moderationCase.targetId}</p>
                <p>Moderator: {moderationCase.moderatorId}</p>
                <p>Expires: {moderationCase.expiresAt ? formatDashboardDate(moderationCase.expiresAt) : 'n/a'}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                <span className="text-primary">Reason:</span> {moderationCase.reason ?? 'No reason provided'}
              </p>
              {moderationCase.evidence ? (
                <p className="text-sm text-muted mt-1">
                  <span className="text-primary">Evidence:</span> {moderationCase.evidence}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({
  created,
  error,
}: {
  created?: string;
  error?: string;
}) {
  if (created === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Moderation note created.
      </div>
    );
  }

  if (error) {
    if (error === 'conflict') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          Could not allocate a moderation case number. Retry the request.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid moderation payload. Check target user ID and note content.
      </div>
    );
  }

  return null;
}
