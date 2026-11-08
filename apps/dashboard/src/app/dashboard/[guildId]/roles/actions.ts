'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';

function normalizeText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function parseMenuOptions(raw: string | null) {
  if (!raw) return [];
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 25);

  const parsed: Array<{ roleId: string; label: string; description: string | null; emoji: string | null; position: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const [roleIdRaw, labelRaw, descriptionRaw, emojiRaw] = lines[i].split('|').map((part) => part?.trim());
    if (!roleIdRaw || !/^\d{17,20}$/.test(roleIdRaw) || !labelRaw) {
      throw new Error('Invalid role menu option format');
    }
    parsed.push({
      roleId: roleIdRaw,
      label: labelRaw.slice(0, 100),
      description: descriptionRaw ? descriptionRaw.slice(0, 100) : null,
      emoji: emojiRaw ? emojiRaw.slice(0, 80) : null,
      position: i,
    });
  }

  return parsed;
}

export async function createRoleMenuAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const title = normalizeText(formData, 'title');
  if (!title || title.length > 100) {
    redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
  }

  try {
    const options = parseMenuOptions(normalizeText(formData, 'options'));
    if (options.length === 0) {
      redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
    }

    const channelId = normalizeSnowflakeInput(formData, 'channelId');
    if (!channelId) {
      redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
    }

    const maxSelectionsRaw = normalizeText(formData, 'maxSelections');
    const maxSelections = maxSelectionsRaw ? Number(maxSelectionsRaw) : 0;
    if (!Number.isInteger(maxSelections) || maxSelections < 0 || maxSelections > 25) {
      redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
    }
    if (maxSelections > 0 && maxSelections > options.length) {
      redirect(`/dashboard/${guildId}/roles?error=max_selections`);
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.roleMenu.create({
        data: {
          guildId,
          title,
          description: normalizeText(formData, 'description'),
          channelId,
          maxSelections,
          exclusive: formData.get('exclusive') === 'on',
        },
        select: { id: true },
      });

      await tx.roleMenuOption.createMany({
        data: options.map((option) => ({
          roleMenuId: created.id,
          roleId: option.roleId,
          label: option.label,
          description: option.description,
          emoji: option.emoji,
          position: option.position,
        })),
      });
    });
  } catch {
    redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/roles`);
  redirect(`/dashboard/${guildId}/roles?created=1`);
}

export async function deleteRoleMenuAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const menuId = normalizeText(formData, 'menuId');
  if (!menuId) {
    redirect(`/dashboard/${guildId}/roles?error=invalid_payload`);
  }

  await prisma.roleMenu.deleteMany({
    where: { id: menuId, guildId },
  });

  revalidatePath(`/dashboard/${guildId}/roles`);
  redirect(`/dashboard/${guildId}/roles?deleted=1`);
}
