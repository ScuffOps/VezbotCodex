import { Save, Trash2, UsersRound } from 'lucide-react';
import { prisma } from '@vezbot/database';
import { SubmitButton } from '@/components/submit-button';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { createRoleMenuAction, deleteRoleMenuAction } from './actions';

interface PageProps {
  params: { guildId: string };
  searchParams?: {
    created?: string;
    deleted?: string;
    error?: string;
  };
}

export default async function ReactionRolesPage({ params, searchParams }: PageProps) {
  await requireManageableGuildAccess(params.guildId);

  const menus = await prisma.roleMenu.findMany({
    where: { guildId: params.guildId },
    include: {
      options: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Reaction Roles</h1>
        <p className="text-muted-foreground">
          Manage role menus and menu options used by Discord-side reaction or component role flows.
        </p>
      </div>

      <Notice created={searchParams?.created} deleted={searchParams?.deleted} error={searchParams?.error} />

      <form action={createRoleMenuAction.bind(null, params.guildId)} className="glass-panel p-6 mb-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-2">Create role menu</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Options format: <code className="text-primary">roleId | label | description | emoji</code> (one option per line).
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Menu title</label>
            <input id="title" name="title" type="text" className="input" maxLength={100} required />
          </div>
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium mb-2">Channel ID</label>
            <input id="channelId" name="channelId" type="text" className="input" placeholder="123456789012345678" inputMode="numeric" pattern="\d{17,20}" required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium mb-2">Menu description</label>
            <textarea id="description" name="description" rows={3} className="input resize-none" maxLength={1000} />
          </div>
          <div>
            <label htmlFor="maxSelections" className="block text-sm font-medium mb-2">Max selections</label>
            <input id="maxSelections" name="maxSelections" type="number" min={0} max={25} defaultValue={0} className="input" />
            <p className="text-xs text-muted mt-1">Use 0 for unlimited.</p>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-4 cursor-pointer">
            <input type="checkbox" name="exclusive" className="mt-1 h-4 w-4 accent-[var(--primary)]" />
            <span>
              <span className="block font-medium">Exclusive menu</span>
              <span className="block text-sm text-muted-foreground">Selecting one role removes others in this menu.</span>
            </span>
          </label>
          <div className="md:col-span-2">
            <label htmlFor="options" className="block text-sm font-medium mb-2">Menu options</label>
            <textarea
              id="options"
              name="options"
              rows={6}
              className="input resize-none"
              placeholder={'123456789012345678 | Updates | Product updates | 🔔\n123456789012345679 | Events | Event pings | 🎉'}
              required
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton className="btn btn-primary">
            <Save className="w-4 h-4" />
            Create role menu
          </SubmitButton>
        </div>
      </form>

      {menus.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground animate-fade-in">
          No role menus configured yet.
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu, index) => (
            <div
              key={menu.id}
              className="glass-panel p-6 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <UsersRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{menu.title}</h3>
                    <p className="text-xs text-muted">Channel: {menu.channelId} • Options: {menu.options.length}</p>
                  </div>
                </div>
                <form action={deleteRoleMenuAction.bind(null, params.guildId)}>
                  <input type="hidden" name="menuId" value={menu.id} />
                  <button type="submit" className="btn btn-secondary text-error">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </form>
              </div>

              {menu.description ? (
                <p className="text-sm text-muted-foreground mb-3">{menu.description}</p>
              ) : null}

              <div className="grid gap-2 text-xs text-muted mb-4 md:grid-cols-2">
                <p>Max selections: {menu.maxSelections === 0 ? 'unlimited' : menu.maxSelections}</p>
                <p>Exclusive: {menu.exclusive ? 'yes' : 'no'}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-primary mb-2">Options</p>
                <div className="space-y-2">
                  {menu.options.map((option) => (
                    <div key={option.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted">({option.roleId})</span>
                      {option.emoji ? <span>{option.emoji}</span> : null}
                      {option.description ? <span className="text-muted-foreground">- {option.description}</span> : null}
                    </div>
                  ))}
                </div>
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
  deleted,
  error,
}: {
  created?: string;
  deleted?: string;
  error?: string;
}) {
  if (created === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-in">
        Role menu created.
      </div>
    );
  }

  if (deleted === '1') {
    return (
      <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning animate-fade-in">
        Role menu deleted.
      </div>
    );
  }

  if (error) {
    if (error === 'max_selections') {
      return (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          Max selections cannot exceed the number of menu options.
        </div>
      );
    }

    return (
      <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
        Invalid role menu payload. Verify channel/role IDs and option format.
      </div>
    );
  }

  return null;
}
