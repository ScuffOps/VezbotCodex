import { Save } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { saveTwitchSettingsAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    error?: string;
  };
}

interface TwitchConfig {
  streamers?: string[];
  mentionRoleId?: string | null;
  messageTemplate?: string | null;
  announceEveryone?: boolean;
}

export default async function TwitchPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const integration = await prisma.integrationConfig.findUnique({
    where: {
      guildId_provider: {
        guildId: params.guildId,
        provider: 'twitch',
      },
    },
  });

  const config = parseTwitchConfig(integration?.config);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Twitch</h1>
        <p className="text-muted-foreground">
          Configure stream watchlists and announcement payload settings for this guild.
        </p>
      </div>

      <Notice saved={searchParams?.saved} error={searchParams?.error} />

      <form action={saveTwitchSettingsAction.bind(null, params.guildId)} className="space-y-6">
        <section className="glass-panel p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Stream notifications</h2>
              <p className="text-sm text-muted-foreground">
                Settings are stored in `integration_configs` under provider `twitch`.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              Live
            </span>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer mb-5">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={integration?.enabled ?? false}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-medium">Enable Twitch notifications</span>
              <span className="block text-sm text-muted-foreground">
                Requires at least one streamer and a Discord notification channel ID.
              </span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField
              name="notifyChannelId"
              label="Notification channel ID"
              description="Channel where stream alerts should post."
              defaultValue={integration?.notifyChannelId ?? null}
            />
            <ReferenceField
              name="mentionRoleId"
              label="Mention role ID (optional)"
              description="Role to mention when stream notifications fire."
              defaultValue={config.mentionRoleId ?? null}
            />
            <div className="md:col-span-2">
              <label htmlFor="streamers" className="block text-sm font-medium mb-2">
                Streamers (one username per line)
              </label>
              <textarea
                id="streamers"
                name="streamers"
                rows={5}
                className="input resize-none"
                defaultValue={(config.streamers ?? []).join('\n')}
                placeholder={'ninja\nauronplay'}
              />
              <p className="text-xs text-muted mt-1">
                Use Twitch usernames only: lowercase letters, numbers, and underscores.
              </p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="messageTemplate" className="block text-sm font-medium mb-2">
                Message template (optional)
              </label>
              <textarea
                id="messageTemplate"
                name="messageTemplate"
                rows={3}
                className="input resize-none"
                maxLength={600}
                defaultValue={config.messageTemplate ?? ''}
                placeholder="{streamer} is now live: {title} {url}"
              />
              <p className="text-xs text-muted mt-1">
                Supported placeholders are bot-defined; this stores the raw template text only.
              </p>
            </div>
            <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
              <input
                type="checkbox"
                name="announceEveryone"
                defaultChecked={config.announceEveryone ?? false}
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium">Allow @everyone mention</span>
                <span className="block text-sm text-muted-foreground">
                  Stores mention preference for the bot-side announcer.
                </span>
              </span>
            </label>
          </div>
        </section>

        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '80ms' }}>
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save Twitch settings
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function parseTwitchConfig(raw: string | null | undefined): TwitchConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as TwitchConfig;
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.streamers && !Array.isArray(parsed.streamers)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function Notice({
  saved,
  error,
}: {
  saved?: string;
  error?: string;
}) {
  if (saved === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Twitch settings saved.
      </div>
    );
  }

  if (error) {
    if (error === 'required_fields') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          When enabled, Twitch requires both a notification channel and at least one streamer.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid Twitch payload. Verify channel IDs and streamer usernames.
      </div>
    );
  }

  return null;
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
