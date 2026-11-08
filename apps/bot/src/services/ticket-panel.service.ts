import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type TextChannel,
} from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger, ticketEmbed } from "@vezbot/discord";

const log = createLogger({ service: "ticket-panel" });

export async function postTicketPanel(
  guild: Guild,
  requestedById: string,
  channelId: string,
  title: string,
  description: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const [config, member] = await Promise.all([
    prisma.guildConfig.findUnique({
      where: { guildId: guild.id },
      select: {
        ticketsEnabled: true,
        ticketCategoryId: true,
      },
    }),
    guild.members.fetch(requestedById).catch(() => null),
  ]);

  if (!member) {
    return { success: false, error: "The requesting user is not a member of this guild." };
  }

  if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return { success: false, error: "The requesting user does not have Manage Server." };
  }

  if (!config?.ticketsEnabled || !config.ticketCategoryId) {
    return {
      success: false,
      error: "Tickets must be enabled and a ticket category ID must be configured before posting a panel.",
    };
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (!channel || channel.type !== ChannelType.GuildText) {
    return { success: false, error: "Ticket panels can only be posted into a text channel." };
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  if (!botMember) {
    return { success: false, error: "The bot member could not be resolved for this guild." };
  }

  const permissions = channel.permissionsFor(botMember);
  if (!permissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    return {
      success: false,
      error: "The bot cannot view or send messages in the selected panel channel.",
    };
  }

  const openButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket-create:${guild.id}`)
      .setLabel("Open Ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫")
  );

  const embed = ticketEmbed(
    title,
    description ||
      "Use the button below to open a new support ticket. A private channel will be created for you."
  );

  try {
    const message = await (channel as TextChannel).send({
      embeds: [embed],
      components: [openButton],
    });

    log.info({ guildId: guild.id, channelId, messageId: message.id }, "Ticket panel posted");
    return { success: true, messageId: message.id };
  } catch (error) {
    log.error({ error, guildId: guild.id, channelId }, "Failed to post ticket panel");
    return { success: false, error: "Failed to post the ticket panel message." };
  }
}
