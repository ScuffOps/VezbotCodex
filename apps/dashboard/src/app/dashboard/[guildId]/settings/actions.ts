'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';

function hasCheckedField(formData: FormData, field: string) {
  return formData.get(field) === 'on';
}

export async function saveGuildSettingsAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        ticketsEnabled: hasCheckedField(formData, 'ticketsEnabled'),
        moderationEnabled: hasCheckedField(formData, 'moderationEnabled'),
        roleMenusEnabled: hasCheckedField(formData, 'roleMenusEnabled'),
        loggingEnabled: hasCheckedField(formData, 'loggingEnabled'),
        onboardingEnabled: hasCheckedField(formData, 'onboardingEnabled'),
        integrationsEnabled: hasCheckedField(formData, 'integrationsEnabled'),
        logChannelId: normalizeSnowflakeInput(formData, 'logChannelId'),
        modLogChannelId: normalizeSnowflakeInput(formData, 'modLogChannelId'),
        welcomeChannelId: normalizeSnowflakeInput(formData, 'welcomeChannelId'),
        modRoleId: normalizeSnowflakeInput(formData, 'modRoleId'),
        adminRoleId: normalizeSnowflakeInput(formData, 'adminRoleId'),
        muteRoleId: normalizeSnowflakeInput(formData, 'muteRoleId'),
      },
      create: {
        guildId,
        ticketsEnabled: hasCheckedField(formData, 'ticketsEnabled'),
        moderationEnabled: hasCheckedField(formData, 'moderationEnabled'),
        roleMenusEnabled: hasCheckedField(formData, 'roleMenusEnabled'),
        loggingEnabled: hasCheckedField(formData, 'loggingEnabled'),
        onboardingEnabled: hasCheckedField(formData, 'onboardingEnabled'),
        integrationsEnabled: hasCheckedField(formData, 'integrationsEnabled'),
        logChannelId: normalizeSnowflakeInput(formData, 'logChannelId'),
        modLogChannelId: normalizeSnowflakeInput(formData, 'modLogChannelId'),
        welcomeChannelId: normalizeSnowflakeInput(formData, 'welcomeChannelId'),
        modRoleId: normalizeSnowflakeInput(formData, 'modRoleId'),
        adminRoleId: normalizeSnowflakeInput(formData, 'adminRoleId'),
        muteRoleId: normalizeSnowflakeInput(formData, 'muteRoleId'),
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/settings?error=invalid_reference`);
  }

  revalidatePath(`/dashboard/${guildId}/settings`);
  redirect(`/dashboard/${guildId}/settings?saved=1`);
}
