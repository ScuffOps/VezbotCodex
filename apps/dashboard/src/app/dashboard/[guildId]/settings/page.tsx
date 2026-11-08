import { Save } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { getOrCreateDashboardGuildConfig } from '@/lib/dashboard-data';
import { saveGuildSettingsAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    error?: string;
  };
}

export default async function SettingsPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);
  const config = await getOrCreateDashboardGuildConfig(params.guildId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          These fields map directly to the current `GuildConfig` record the bot already uses.
        </p>
      </div>

      <Notice saved={searchParams?.saved} error={searchParams?.error} />

      <form action={saveGuildSettingsAction.bind(null, params.guildId)} className="space-y-6">
        <section className="glass-panel p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Feature toggles</h2>
              <p className="text-sm text-muted-foreground">
                Flip the features the bot should treat as enabled for this guild.
              </p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              Live
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ToggleRow
              name="ticketsEnabled"
              label="Tickets"
              description="Allows the bot to create and manage support tickets."
              defaultChecked={config.ticketsEnabled}
            />
            <ToggleRow
              name="moderationEnabled"
              label="Moderation"
              description="Enables moderation-related bot behavior and records."
              defaultChecked={config.moderationEnabled}
            />
            <ToggleRow
              name="roleMenusEnabled"
              label="Role menus"
              description="Lets users self-assign configured roles from bot messages."
              defaultChecked={config.roleMenusEnabled}
            />
            <ToggleRow
              name="loggingEnabled"
              label="Logging"
              description="Allows the bot to write general and moderation logs."
              defaultChecked={config.loggingEnabled}
            />
            <ToggleRow
              name="onboardingEnabled"
              label="Onboarding"
              description="Reserved for welcome and onboarding automations."
              defaultChecked={config.onboardingEnabled}
            />
            <ToggleRow
              name="integrationsEnabled"
              label="Integrations"
              description="Reserved for Twitch and other provider-driven workflows."
              defaultChecked={config.integrationsEnabled}
            />
          </div>
        </section>

        <section className="glass-panel p-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <h2 className="text-lg font-semibold mb-2">Channels</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Paste Discord channel IDs for now. Live channel picking and validation will move through the bot control API in a later phase.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField
              name="logChannelId"
              label="General log channel ID"
              description="Where non-moderation bot logs should be sent."
              defaultValue={config.logChannelId}
            />
            <ReferenceField
              name="modLogChannelId"
              label="Moderation log channel ID"
              description="Where moderation cases and actions should be recorded."
              defaultValue={config.modLogChannelId}
            />
            <ReferenceField
              name="welcomeChannelId"
              label="Welcome channel ID"
              description="Future-facing onboarding destination."
              defaultValue={config.welcomeChannelId}
            />
          </div>
        </section>

        <section className="glass-panel p-6 animate-fade-in" style={{ animationDelay: '160ms' }}>
          <h2 className="text-lg font-semibold mb-2">Roles</h2>
          <p className="text-sm text-muted-foreground mb-5">
            These role IDs are stored directly in the current guild config and read by the bot.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField
              name="modRoleId"
              label="Moderator role ID"
              description="Role granted ticket access and used by moderation flows."
              defaultValue={config.modRoleId}
            />
            <ReferenceField
              name="adminRoleId"
              label="Admin role ID"
              description="Reserved for elevated dashboard or bot policy checks."
              defaultValue={config.adminRoleId}
            />
            <ReferenceField
              name="muteRoleId"
              label="Mute role ID"
              description="Reserved for moderation role assignment flows."
              defaultValue={config.muteRoleId}
            />
          </div>
        </section>

        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '220ms' }}>
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save settings
          </SubmitButton>
        </div>
      </form>
    </div>
  );
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
        Guild settings saved to the shared database.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        One or more channel or role IDs were invalid. Use raw Discord snowflakes only.
      </div>
    );
  }

  return null;
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
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
