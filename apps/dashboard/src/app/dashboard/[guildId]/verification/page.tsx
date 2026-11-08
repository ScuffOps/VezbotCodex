import { Save, ShieldCheck } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { saveVerificationSettingsAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    error?: string;
  };
}

interface VerificationConfig {
  verificationChannelId?: string | null;
  verifiedRoleId?: string | null;
  unverifiedRoleId?: string | null;
  welcomeMessage?: string | null;
}

export default async function VerificationPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const integration = await prisma.integrationConfig.findUnique({
    where: {
      guildId_provider: {
        guildId: params.guildId,
        provider: 'verification',
      },
    },
  });

  const parsedConfig = parseVerificationConfig(integration?.config);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Verification</h1>
        <p className="text-muted-foreground">
          Configure verification roles, channels, and onboarding behavior for this guild.
        </p>
      </div>

      <Notice saved={searchParams?.saved} error={searchParams?.error} />

      <form action={saveVerificationSettingsAction.bind(null, params.guildId)} className="space-y-6">
        <section className="glass-panel p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Verification flow</h2>
              <p className="text-sm text-muted-foreground">
                This controls onboarding and verification role assignment metadata.
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
              <span className="block font-medium">Enable verification system</span>
              <span className="block text-sm text-muted-foreground">
                Mirrors onboarding readiness and verification integration state.
              </span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField
              name="verificationChannelId"
              label="Verification channel ID"
              description="Channel where verification prompts should be posted."
              defaultValue={parsedConfig.verificationChannelId ?? null}
            />
            <ReferenceField
              name="logChannelId"
              label="Verification log channel ID"
              description="Channel for verification audit logs."
              defaultValue={integration?.notifyChannelId ?? null}
            />
            <ReferenceField
              name="verifiedRoleId"
              label="Verified role ID"
              description="Role to grant after successful verification."
              defaultValue={parsedConfig.verifiedRoleId ?? null}
            />
            <ReferenceField
              name="unverifiedRoleId"
              label="Unverified role ID"
              description="Role to keep until the user verifies."
              defaultValue={parsedConfig.unverifiedRoleId ?? null}
            />
            <div className="md:col-span-2">
              <label htmlFor="welcomeMessage" className="block text-sm font-medium mb-2">
                Welcome message template
              </label>
              <textarea
                id="welcomeMessage"
                name="welcomeMessage"
                rows={4}
                className="input resize-none"
                defaultValue={parsedConfig.welcomeMessage ?? ''}
                placeholder="Welcome! Please complete verification to unlock full access."
                maxLength={2000}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '80ms' }}>
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save verification settings
          </SubmitButton>
        </div>
      </form>

      <section className="glass-panel p-6 mt-6 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Operational note</h3>
            <p className="text-sm text-muted-foreground">
              Dashboard persistence is live. Your Discord-side verification flow can consume these values from the shared database and verification integration config.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function parseVerificationConfig(raw: string | null | undefined): VerificationConfig {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as VerificationConfig;
    return parsed && typeof parsed === 'object' ? parsed : {};
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
        Verification settings saved.
      </div>
    );
  }

  if (error) {
    if (error === 'required_fields') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          Verification requires both a verification channel ID and a verified role ID when enabled.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid channel or role reference. Use raw Discord snowflake IDs.
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
