'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';
import { fetchBotApi } from '@/lib/api';

export async function saveTicketSettingsAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    await prisma.guildConfig.upsert({
      where: { guildId },
      update: {
        ticketsEnabled: formData.get('ticketsEnabled') === 'on',
        ticketCategoryId: normalizeSnowflakeInput(formData, 'ticketCategoryId'),
        ticketLogChannelId: normalizeSnowflakeInput(formData, 'ticketLogChannelId'),
        modRoleId: normalizeSnowflakeInput(formData, 'modRoleId'),
      },
      create: {
        guildId,
        ticketsEnabled: formData.get('ticketsEnabled') === 'on',
        ticketCategoryId: normalizeSnowflakeInput(formData, 'ticketCategoryId'),
        ticketLogChannelId: normalizeSnowflakeInput(formData, 'ticketLogChannelId'),
        modRoleId: normalizeSnowflakeInput(formData, 'modRoleId'),
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/tickets?error=invalid_reference`);
  }

  revalidatePath(`/dashboard/${guildId}/tickets`);
  redirect(`/dashboard/${guildId}/tickets?saved=1`);
}

export async function postTicketPanelAction(guildId: string, formData: FormData) {
  const { session } = await requireManageableGuildAccess(guildId);

  try {
    const panelChannelId = normalizeSnowflakeInput(formData, 'panelChannelId');
    const title = String(formData.get('panelTitle') ?? '').trim() || 'Support Tickets';
    const description =
      String(formData.get('panelDescription') ?? '').trim() ||
      'Use the button below to open a ticket and get help from the server team.';

    if (!panelChannelId || !session.discordId) {
      redirect(`/dashboard/${guildId}/tickets?panelError=invalid_request`);
    }

    const result = await fetchBotApi<{ success: boolean; messageId: string }>('/internal/tickets/panel', {
      method: 'POST',
      body: JSON.stringify({
        guildId,
        userId: session.discordId,
        panelChannelId,
        title,
        description,
      }),
    });

    if (result.error) {
      redirect(`/dashboard/${guildId}/tickets?panelError=post_failed`);
    }
  } catch {
    redirect(`/dashboard/${guildId}/tickets?panelError=invalid_request`);
  }

  revalidatePath(`/dashboard/${guildId}/tickets`);
  redirect(`/dashboard/${guildId}/tickets?panelPosted=1`);
}
