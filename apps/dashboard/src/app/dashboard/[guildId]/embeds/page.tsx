import { Save, Trash2 } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { createEmbedPresetAction, saveEmbedTemplateAction, deleteEmbedTemplateAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    saved?: string;
    deleted?: string;
    preset?: string;
    error?: string;
  };
}

export default async function EmbedsPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);
  const templates = await prisma.embedTemplate.findMany({
    where: { guildId: params.guildId },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Embeds</h1>
        <p className="text-muted-foreground">
          Create, edit, and store reusable embed templates for this guild.
        </p>
      </div>

      <Notice
        saved={searchParams?.saved}
        deleted={searchParams?.deleted}
        preset={searchParams?.preset}
        error={searchParams?.error}
      />

      <section className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Quick template library</h2>
        <p className="text-sm text-muted-foreground mb-5">
          One-click starter templates you can clone, edit, and send right away.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <form action={createEmbedPresetAction.bind(null, params.guildId)} className="rounded-2xl border border-border bg-surface/60 p-4">
            <input type="hidden" name="presetId" value="rules_shinra_v2" />
            <p className="font-medium mb-1">Rules preset: Shinra style (V2)</p>
            <p className="text-xs text-muted mb-3">Clean numbered policy card with bold highlights.</p>
            <button type="submit" className="btn btn-secondary">Create preset copy</button>
          </form>
          <form action={createEmbedPresetAction.bind(null, params.guildId)} className="rounded-2xl border border-border bg-surface/60 p-4">
            <input type="hidden" name="presetId" value="rules_soft_v2" />
            <p className="font-medium mb-1">Rules preset: Soft symbol style (V2)</p>
            <p className="text-xs text-muted mb-3">Aesthetic symbol header with soft multi-block rule text.</p>
            <button type="submit" className="btn btn-secondary">Create preset copy</button>
          </form>
        </div>
      </section>

      <form action={saveEmbedTemplateAction.bind(null, params.guildId)} className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Create template</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Store canonical embed payloads here so Discord-side posting can reuse them consistently.
        </p>

        <TemplateFields />

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Save template
          </SubmitButton>
        </div>
      </form>

      {templates.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground animate-fade-in">
          No embed templates yet. Create your first template above.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template, index) => (
            <form
              key={template.id}
              action={saveEmbedTemplateAction.bind(null, params.guildId)}
              className="glass-panel p-6 animate-fade-in"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <input type="hidden" name="templateId" value={template.id} />
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-xs text-muted">Updated {template.updatedAt.toLocaleString()}</p>
                </div>
                <div className="h-8 w-8 rounded-full border border-border" style={{ background: template.colorHex ?? '#374151' }} />
              </div>

              <TemplateFields
                defaults={{
                  name: template.name,
                  content: template.content,
                  title: template.title,
                  description: template.description,
                  colorHex: template.colorHex,
                  footerText: template.footerText,
                  channelId: template.channelId,
                  imageUrl: template.imageUrl,
                  thumbnailUrl: template.thumbnailUrl,
                  componentsV2Enabled: template.componentsV2Enabled,
                  componentsJson: template.componentsJson,
                }}
              />

              <div className="mt-5 flex justify-between gap-3">
                <button
                  formAction={deleteEmbedTemplateAction.bind(null, params.guildId)}
                  type="submit"
                  name="templateId"
                  value={template.id}
                  className="btn btn-secondary text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <SubmitButton className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  Update template
                </SubmitButton>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({
  saved,
  deleted,
  preset,
  error,
}: {
  saved?: string;
  deleted?: string;
  preset?: string;
  error?: string;
}) {
  if (preset === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Template preset created. Customize it below.
      </div>
    );
  }

  if (saved === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Embed template saved.
      </div>
    );
  }

  if (deleted === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning animate-fade-in">
        Embed template deleted.
      </div>
    );
  }

  if (error) {
    if (error === 'duplicate_name') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          A template with that name already exists in this guild.
        </div>
      );
    }

    if (error === 'not_found') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          That embed template no longer exists.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        {error === 'components_required'
          ? 'Component V2 mode requires a valid components JSON array.'
          : 'Invalid embed payload. Check required fields, channel snowflakes, URLs, and components JSON.'}
      </div>
    );
  }

  return null;
}

function TemplateFields({
  defaults,
}: {
  defaults?: {
    name: string | null;
    content: string | null;
    title: string | null;
    description: string | null;
    colorHex: string | null;
    footerText: string | null;
    channelId: string | null;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    componentsV2Enabled: boolean;
    componentsJson: string | null;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">Template name</label>
        <input id="name" name="name" type="text" className="input" defaultValue={defaults?.name ?? ''} maxLength={60} required />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">Message content</label>
        <input id="content" name="content" type="text" className="input" defaultValue={defaults?.content ?? ''} maxLength={2000} placeholder="Optional plain message content" />
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">Embed title</label>
        <input id="title" name="title" type="text" className="input" defaultValue={defaults?.title ?? ''} maxLength={256} required />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
        <textarea id="description" name="description" rows={4} className="input resize-none" defaultValue={defaults?.description ?? ''} maxLength={4000} />
      </div>
      <div>
        <label htmlFor="colorHex" className="block text-sm font-medium mb-2">Color hex</label>
        <input id="colorHex" name="colorHex" type="text" className="input" defaultValue={defaults?.colorHex ?? ''} placeholder="#5865F2" maxLength={7} />
      </div>
      <div>
        <label htmlFor="channelId" className="block text-sm font-medium mb-2">Default channel ID</label>
        <input id="channelId" name="channelId" type="text" className="input" defaultValue={defaults?.channelId ?? ''} placeholder="123456789012345678" inputMode="numeric" pattern="\d{17,20}" />
      </div>
      <div>
        <label htmlFor="footerText" className="block text-sm font-medium mb-2">Footer text</label>
        <input id="footerText" name="footerText" type="text" className="input" defaultValue={defaults?.footerText ?? ''} maxLength={2048} />
      </div>
      <div>
        <label htmlFor="thumbnailUrl" className="block text-sm font-medium mb-2">Thumbnail URL</label>
        <input id="thumbnailUrl" name="thumbnailUrl" type="url" className="input" defaultValue={defaults?.thumbnailUrl ?? ''} placeholder="https://..." />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">Image URL</label>
        <input id="imageUrl" name="imageUrl" type="url" className="input" defaultValue={defaults?.imageUrl ?? ''} placeholder="https://..." />
      </div>
      <label className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
        <input
          type="checkbox"
          name="componentsV2Enabled"
          defaultChecked={defaults?.componentsV2Enabled ?? false}
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
        />
        <span>
          <span className="block font-medium">Enable Component V2 mode</span>
          <span className="block text-sm text-muted-foreground">
            Sends this template using `MessageFlags.IsComponentsV2` and the JSON below (no standard embed/content payload in Discord V2 mode).
          </span>
        </span>
      </label>
      <div className="md:col-span-2">
        <label htmlFor="componentsJson" className="block text-sm font-medium mb-2">Components JSON (V2)</label>
        <textarea
          id="componentsJson"
          name="componentsJson"
          rows={8}
          className="input font-mono text-xs resize-y"
          defaultValue={defaults?.componentsJson ?? ''}
          placeholder='[{"type":10,"content":"# Welcome to {server_name}"}]'
        />
        <p className="text-xs text-muted mt-1">
          Must be a valid JSON array of Discord message components. Keep under 40 components total.
        </p>
      </div>
    </div>
  );
}
