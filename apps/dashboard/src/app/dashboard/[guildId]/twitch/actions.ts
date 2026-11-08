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

function parseStreamers(raw: string | null) {
  if (!raw) return [];

  const dedupe = new Set<string>();
  const parsed: string[] = [];

  for (const token of raw.split(/\r?\n|,/g)) {
    const streamer = token.trim().toLowerCase();
    if (!streamer) continue;
    if (!/^[a-z0-9_]{3,25}$/.test(streamer)) {
      throw new Error('Invalid Twitch username');
    }
    if (dedupe.has(streamer)) continue;
    dedupe.add(streamer);
    parsed.push(streamer);
    if (parsed.length === 50) break;
  }

  return parsed;
}

export async function saveTwitchSettingsAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    const enabled = formData.get('enabled') === 'on';
    const notifyChannelId = normalizeSnowflakeInput(formData, 'notifyChannelId');
    const mentionRoleId = normalizeSnowflakeInput(formData, 'mentionRoleId');
    const streamers = parseStreamers(normalizeText(formData, 'streamers'));
    const messageTemplate = normalizeText(formData, 'messageTemplate');
    const announceEveryone = formData.get('announceEveryone') === 'on';

    if (messageTemplate && messageTemplate.length > 600) {
      redirect(`/dashboard/${guildId}/twitch?error=invalid_payload`);
    }

    if (enabled && (!notifyChannelId || streamers.length === 0)) {
      redirect(`/dashboard/${guildId}/twitch?error=required_fields`);
    }

    await prisma.integrationConfig.upsert({
      where: {
        guildId_provider: {
          guildId,
          provider: 'twitch',
        },
      },
      update: {
        enabled,
        notifyChannelId,
        config: JSON.stringify({
          streamers,
          mentionRoleId,
          messageTemplate,
          announceEveryone,
        }),
      },
      create: {
        guildId,
        provider: 'twitch',
        enabled,
        notifyChannelId,
        config: JSON.stringify({
          streamers,
          mentionRoleId,
          messageTemplate,
          announceEveryone,
        }),
      },
    });

    if (enabled) {
      await prisma.guildConfig.upsert({
        where: { guildId },
        update: { integrationsEnabled: true },
        create: { guildId, integrationsEnabled: true },
      });
    }
  } catch {
    redirect(`/dashboard/${guildId}/twitch?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/twitch`);
  redirect(`/dashboard/${guildId}/twitch?saved=1`);
}
