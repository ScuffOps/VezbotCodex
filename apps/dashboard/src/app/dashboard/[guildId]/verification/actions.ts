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

export async function saveVerificationSettingsAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    const enabled = formData.get('enabled') === 'on';
    const verificationChannelId = normalizeSnowflakeInput(formData, 'verificationChannelId');
    const verifiedRoleId = normalizeSnowflakeInput(formData, 'verifiedRoleId');
    const unverifiedRoleId = normalizeSnowflakeInput(formData, 'unverifiedRoleId');
    const logChannelId = normalizeSnowflakeInput(formData, 'logChannelId');
    const welcomeMessage = normalizeText(formData, 'welcomeMessage');

    if (enabled && (!verificationChannelId || !verifiedRoleId)) {
      redirect(`/dashboard/${guildId}/verification?error=required_fields`);
    }
    if (welcomeMessage && welcomeMessage.length > 2000) {
      redirect(`/dashboard/${guildId}/verification?error=invalid_reference`);
    }

    await prisma.integrationConfig.upsert({
      where: {
        guildId_provider: {
          guildId,
          provider: 'verification',
        },
      },
      update: {
        enabled,
        notifyChannelId: logChannelId,
        config: JSON.stringify({
          verificationChannelId,
          verifiedRoleId,
          unverifiedRoleId,
          welcomeMessage,
        }),
      },
      create: {
        guildId,
        provider: 'verification',
        enabled,
        notifyChannelId: logChannelId,
        config: JSON.stringify({
          verificationChannelId,
          verifiedRoleId,
          unverifiedRoleId,
          welcomeMessage,
        }),
      },
    });

    await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        onboardingEnabled: enabled,
      },
      create: {
        guildId,
        onboardingEnabled: enabled,
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/verification?error=invalid_reference`);
  }

  revalidatePath(`/dashboard/${guildId}/verification`);
  redirect(`/dashboard/${guildId}/verification?saved=1`);
}
