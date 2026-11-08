'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';
import { parseSchedule, validateTimezone } from '@vezbot/shared';

function normalizeText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

export async function createReminderAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    const userId = normalizeSnowflakeInput(formData, 'userId');
    const channelId = normalizeSnowflakeInput(formData, 'channelId');
    const message = normalizeText(formData, 'message');
    const timezone = validateTimezone(normalizeText(formData, 'timezone') ?? 'UTC');
    const remindAtRaw = normalizeText(formData, 'remindAt');

    if (!userId || !message || !remindAtRaw) {
      redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
    }
    if (message.length > 1800) {
      redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
    }
    if (timezone.length > 80) {
      redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
    }

    const remindAt = parseSchedule(remindAtRaw, timezone);

    await prisma.reminder.create({
      data: {
        guildId,
        userId,
        channelId,
        message,
        remindAt,
        timezone,
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/reminders`);
  redirect(`/dashboard/${guildId}/reminders?created=1`);
}

export async function setReminderSentAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const reminderId = normalizeText(formData, 'reminderId');
  const sentValue = normalizeText(formData, 'sent');

  if (!reminderId || !sentValue || !['true', 'false'].includes(sentValue)) {
    redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
  }

  const updated = await prisma.reminder.updateMany({
    where: { id: reminderId, guildId, claimedAt: null, ...(sentValue === 'false' ? { remindAt: { gt: new Date() } } : {}) },
    data: { sent: sentValue === 'true', attempts: 0, lastError: null },
  });

  if (updated.count === 0) {
    redirect(`/dashboard/${guildId}/reminders?error=not_found`);
  }

  revalidatePath(`/dashboard/${guildId}/reminders`);
  redirect(`/dashboard/${guildId}/reminders?updated=1`);
}

export async function deleteReminderAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const reminderId = normalizeText(formData, 'reminderId');
  if (!reminderId) {
    redirect(`/dashboard/${guildId}/reminders?error=invalid_payload`);
  }

  await prisma.reminder.deleteMany({
    where: { id: reminderId, guildId },
  });

  revalidatePath(`/dashboard/${guildId}/reminders`);
  redirect(`/dashboard/${guildId}/reminders?deleted=1`);
}
