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

function isPrismaCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (error as { code: string }).code === code
  );
}

export async function createModerationNoteAction(guildId: string, formData: FormData) {
  const { session } = await requireManageableGuildAccess(guildId);

  const targetId = normalizeSnowflakeInput(formData, 'targetId');
  const reason = normalizeText(formData, 'reason');
  const evidence = normalizeText(formData, 'evidence');

  if (!targetId || !reason || reason.length > 1000) {
    redirect(`/dashboard/${guildId}/moderation?error=invalid_payload`);
  }
  if (evidence && evidence.length > 4000) {
    redirect(`/dashboard/${guildId}/moderation?error=invalid_payload`);
  }

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.$transaction(async (tx) => {
          const maxCase = await tx.moderationCase.aggregate({
            where: { guildId },
            _max: { caseNumber: true },
          });
          const nextCaseNumber = (maxCase._max.caseNumber ?? 0) + 1;

          await tx.moderationCase.create({
            data: {
              guildId,
              caseNumber: nextCaseNumber,
              targetId,
              moderatorId: session.discordId ?? 'dashboard',
              type: 'NOTE',
              reason,
              evidence,
            },
          });
        });

        revalidatePath(`/dashboard/${guildId}/moderation`);
        redirect(`/dashboard/${guildId}/moderation?created=1`);
      } catch (error) {
        if (isPrismaCode(error, 'P2002')) {
          continue;
        }
        throw error;
      }
    }

    redirect(`/dashboard/${guildId}/moderation?error=conflict`);
  } catch {
    redirect(`/dashboard/${guildId}/moderation?error=invalid_payload`);
  }
}
