import { Save } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { saveBrandingSettingsAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    error?: string;
  };
}

interface BrandingConfig {
  brandName?: string | null;
  accentColor?: string | null;
  tagline?: string | null;
  footerText?: string | null;
  supportUrl?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export default async function BrandingPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const integration = await prisma.integrationConfig.findUnique({
    where: {
      guildId_provider: {
        guildId: params.guildId,
        provider: 'branding',
      },
    },
  });

  const config = parseBrandingConfig(integration?.config);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Branding</h1>
        <p className="text-muted-foreground">
          Store per-guild brand presentation values for embeds, onboarding copy, and dashboard surfaces.
        </p>
      </div>

      <Notice saved={searchParams?.saved} error={searchParams?.error} />

      <form action={saveBrandingSettingsAction.bind(null, params.guildId)} className="space-y-6">
        <section className="glass-panel p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold">Brand profile</h2>
              <p className="text-sm text-muted-foreground">
                This config is persisted in `integration_configs` under the `branding` provider.
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
              <span className="block font-medium">Enable custom branding</span>
              <span className="block text-sm text-muted-foreground">
                Keeps a dedicated on/off switch for bot-side and dashboard-side rendering.
              </span>
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              name="brandName"
              label="Brand name"
              placeholder="Vezbot_FIN"
              maxLength={80}
              defaultValue={config.brandName ?? ''}
              help="Display name used in branding-aware surfaces."
            />
            <Field
              name="accentColor"
              label="Accent color"
              placeholder="#5865F2"
              maxLength={7}
              defaultValue={config.accentColor ?? ''}
              help="Hex color used for style accents."
            />
            <div className="md:col-span-2">
              <Field
                name="tagline"
                label="Tagline"
                placeholder="Server operations, clean and fast."
                maxLength={180}
                defaultValue={config.tagline ?? ''}
                help="Short copy for cards, intros, and announcements."
              />
            </div>
            <div className="md:col-span-2">
              <Field
                name="footerText"
                label="Default footer"
                placeholder="Powered by Vezbot_FIN"
                maxLength={200}
                defaultValue={config.footerText ?? ''}
                help="Shared footer text for embed-like surfaces."
              />
            </div>
            <Field
              name="supportUrl"
              label="Support URL"
              type="url"
              placeholder="https://..."
              defaultValue={config.supportUrl ?? ''}
              help="Public support, docs, or status URL."
            />
            <Field
              name="logoUrl"
              label="Logo URL"
              type="url"
              placeholder="https://..."
              defaultValue={config.logoUrl ?? ''}
              help="Optional logo image used by branding-aware views."
            />
            <div className="md:col-span-2">
              <Field
                name="bannerUrl"
                label="Banner URL"
                type="url"
                placeholder="https://..."
                defaultValue={config.bannerUrl ?? ''}
                help="Optional wide image for splash and hero areas."
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '80ms' }}>
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save branding
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function parseBrandingConfig(raw: string | null | undefined): BrandingConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as BrandingConfig;
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
        Branding settings saved.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid branding payload. Use valid URLs and a hex accent color like `#5865F2`.
      </div>
    );
  }

  return null;
}

function Field({
  name,
  label,
  help,
  defaultValue,
  placeholder,
  maxLength,
  type = 'text',
}: {
  name: string;
  label: string;
  help: string;
  defaultValue: string;
  placeholder: string;
  maxLength?: number;
  type?: 'text' | 'url';
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        className="input"
      />
      <p className="text-xs text-muted mt-1">{help}</p>
    </div>
  );
}
