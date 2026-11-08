'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';

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
    if (option.length > 120) {
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
  const options = parseOptions(normalizeText(formData, 'options'));

  if (!question || question.length < 4 || question.length > 300 || options.length < 2) {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  try {
    const closesAtRaw = normalizeText(formData, 'closesAt');
    const closesAt = closesAtRaw ? new Date(closesAtRaw) : null;
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
        anonymous: formData.get('anonymous') === 'on',
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
  await requireManageableGuildAccess(guildId);

  const pollId = normalizeText(formData, 'pollId');
  const status = normalizeText(formData, 'status');
  if (!pollId || !status || !POLL_STATUSES.has(status)) {
    redirect(`/dashboard/${guildId}/polls?error=invalid_payload`);
  }

  const updated = await prisma.poll.updateMany({
    where: { id: pollId, guildId },
    data: { status },
  });

  if (updated.count === 0) {
    redirect(`/dashboard/${guildId}/polls?error=not_found`);
  }

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
    where: { id: pollId, guildId },
  });

  revalidatePath(`/dashboard/${guildId}/polls`);
  redirect(`/dashboard/${guildId}/polls?deleted=1`);
}
