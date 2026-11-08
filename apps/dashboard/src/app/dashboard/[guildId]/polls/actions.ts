'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';
import { parseSchedule } from '@vezbot/shared';
import { fetchBotApi } from '@/lib/api';

const POLL_STATUSES = new Set(['DRAFT', 'ACTIVE', 'CLOSED']);

function normalizeText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function parseOptions(raw: string | null) {
  if (!raw) return [];
  const dedupe = new Set<string>();
  const parsed: string[] = [];

  for (const line of raw.split('\n')) {
    const option = line.trim();
    if (!option) continue;
    if (option.length > 55) {
      throw new Error('Option too long');
    }
    const key = option.toLowerCase();
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    parsed.push(option);
    if (parsed.length === 10) break;
  }

  return parsed;
}

export async function createPollAction(guildId: string, formData: FormData) {
  const { session } = await requireManageableGuildAccess(guildId);

  const question = normalizeText(formData, 'question');
  let options: string[] = [];
  try { options = parseOptions(normalizeText(formData, 'options')); }
  catch { redirect(`/dashboard/${guildId}/polls?error=invalid_payload`); }

  if (!question || question.length < 4 || question.length > 300 || options.length < 2) {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  try {
    const closesAtRaw = normalizeText(formData, 'closesAt');
    const preference = session.discordId ? await prisma.userPreference.findUnique({ where: { userId: session.discordId } }) : null;
    const closesAt = closesAtRaw ? parseSchedule(closesAtRaw, normalizeText(formData, 'timezone') ?? preference?.timezone ?? 'UTC') : null;
    if (closesAtRaw && Number.isNaN(closesAt?.getTime())) {
      redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
    }
    if (closesAt && closesAt.getTime() <= Date.now()) {
      redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
    }

    await prisma.poll.create({
      data: {
        guildId,
        question,
        optionsJson: JSON.stringify(options),
        status: 'DRAFT',
        channelId: normalizeSnowflakeInput(formData, 'channelId'),
        allowMulti: formData.get('allowMulti') === 'on',
        anonymous: false,
        creatorId: session.discordId ?? 'dashboard',
        closesAt,
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/polls`);
  redirect(`/dashboard/${guildId}/polls?created=1`);
}

export async function setPollStatusAction(guildId: string, formData: FormData) {
  const { session } = await requireManageableGuildAccess(guildId);

  const pollId = normalizeText(formData, 'pollId');
  const status = normalizeText(formData, 'status');
  if (!pollId || !status || !POLL_STATUSES.has(status)) {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  if (!session.discordId) redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  const result = await fetchBotApi('/internal/polls/status', {
    method: 'POST', body: JSON.stringify({ guildId, userId: session.discordId, pollId, status }),
  });
  if (result.error) redirect(`/dashboard/${guildId}/polls?error=publish_failed`);

  revalidatePath(`/dashboard/${guildId}/polls`);
  redirect(`/dashboard/${guildId}/polls?updated=1`);
}

export async function deletePollAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const pollId = normalizeText(formData, 'pollId');
  if (!pollId) {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  await prisma.poll.deleteMany({
    where: { id: pollId, guildId, messageId: null, status: { not: 'PUBLISHING' } },
  });

  revalidatePath(`/dashboard/${guildId}/polls`);
  redirect(`/dashboard/${guildId}/polls?deleted=1`);
}
