import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger, ticketEmbed, successEmbed, errorEmbed } from "@vezbot/discord";
import { TicketStatus, Limits } from "@vezbot/shared";
import { getOrCreateGuildConfig } from "./guild-config.service";
import { sendLogEmbed } from "./logging.service";

const log = createLogger({ service: "tickets" });

/**
 * Create a new ticket channel for a user.
 */
export async function createTicket(
  guild: Guild,
  creator: GuildMember,
  subject: string,
  description: string
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  const config = await getOrCreateGuildConfig(guild.id);

  if (!config.ticketsEnabled) {
    return { success: false, error: "Tickets are not enabled in this server." };
  }

  // Check ticket limit per user
  const openTickets = await prisma.ticket.count({
    where: {
      guildId: guild.id,
      creatorId: creator.id,
      status: TicketStatus.Open,
    },
  });

  if (openTickets >= Limits.MaxTicketsPerUser) {
    return {
      success: false,
      error: `You already have ${openTickets} open ticket(s). Please close one before creating another.`,
    };
  }

  // Get next ticket number for this guild
  const lastTicket = await prisma.ticket.findFirst({
    where: { guildId: guild.id },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const ticketNumber = (lastTicket?.ticketNumber ?? 0) + 1;

  // Create the ticket channel
  const channelName = `ticket-${ticketNumber.toString().padStart(4, "0")}`;

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.ticketCategoryId ?? undefined,
      permissionOverwrites: [
        // Deny everyone
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        // Allow ticket creator
        {
          id: creator.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        // Allow bot
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        // Allow mod role if configured
        ...(config.modRoleId
          ? [
              {
                id: config.modRoleId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.ManageMessages,
                ],
              },
            ]
          : []),
      ],
    });

    // Save ticket to database
    await prisma.ticket.create({
      data: {
        guildId: guild.id,
        ticketNumber,
        channelId: channel.id,
        creatorId: creator.id,
        subject,
        status: TicketStatus.Open,
      },
    });

    // Send welcome message in the ticket channel
    const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket-close:${channel.id}`)
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    const welcomeEmbed = ticketEmbed(
      `Ticket #${ticketNumber}`,
      [
        `**Created by:** ${creator}`,
        `**Subject:** ${subject}`,
        "",
        description,
        "",
        "A staff member will be with you shortly.",
        "Click the button below to close this ticket when resolved.",
      ].join("\n")
    );

    await channel.send({ embeds: [welcomeEmbed], components: [closeButton] });

    // Log the ticket creation
    await sendLogEmbed(guild.id, "ticket", ticketEmbed(
      "Ticket Created",
      `**#${ticketNumber}** opened by ${creator} — ${subject}`
    ));

    log.info({ guildId: guild.id, ticketNumber, creator: creator.id }, "Ticket created");

    return { success: true, channelId: channel.id };
  } catch (error) {
    log.error({ error, guildId: guild.id }, "Failed to create ticket channel");
    return { success: false, error: "Failed to create ticket channel. Check bot permissions." };
  }
}

/**
 * Close a ticket — locks the channel, updates DB, generates basic transcript.
 */
export async function closeTicket(
  guild: Guild,
  channelId: string,
  closedBy: GuildMember,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const ticket = await prisma.ticket.findUnique({
    where: { channelId },
  });

  if (!ticket) {
    return { success: false, error: "This channel is not a ticket." };
  }

  if (ticket.status !== TicketStatus.Open) {
    return { success: false, error: "This ticket is already closed." };
  }

  try {
    const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;

    // Generate basic transcript (last N messages)
    let transcript = "";
    if (channel) {
      try {
        const messages = await channel.messages.fetch({ limit: Limits.TicketTranscriptMaxMessages });
        const lines = messages
          .reverse()
          .map((m) => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || "(embed/attachment)"}`)
          .join("\n");
        transcript = lines;
      } catch {
        transcript = "(transcript unavailable)";
      }
    }

    // Update database
    await prisma.ticket.update({
      where: { channelId },
      data: {
        status: TicketStatus.Closed,
        closedBy: closedBy.id,
        closeReason: reason ?? "No reason provided",
        closedAt: new Date(),
        transcript,
      },
    });

    // Send close message then delete channel after delay
    if (channel) {
      const closeEmbed = successEmbed(
        "Ticket Closed",
        [
          `**Closed by:** ${closedBy}`,
          reason ? `**Reason:** ${reason}` : "",
          "",
          "This channel will be deleted in 10 seconds.",
        ]
          .filter(Boolean)
          .join("\n")
      );

      await channel.send({ embeds: [closeEmbed] });

      // Lock the channel immediately
      await channel.permissionOverwrites.set([
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ]);

      // Delete after delay
      setTimeout(async () => {
        try {
          await channel.delete("Ticket closed");
        } catch {
          // Channel may already be deleted
        }
      }, 10_000);
    }

    // Log the close
    await sendLogEmbed(guild.id, "ticket", ticketEmbed(
      "Ticket Closed",
      [
        `**Ticket #${ticket.ticketNumber}** closed by ${closedBy}`,
        reason ? `**Reason:** ${reason}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    ));

    log.info(
      { guildId: guild.id, ticketNumber: ticket.ticketNumber, closedBy: closedBy.id },
      "Ticket closed"
    );

    return { success: true };
  } catch (error) {
    log.error({ error, guildId: guild.id, channelId }, "Failed to close ticket");
    return { success: false, error: "Failed to close ticket. Check bot permissions." };
  }
}
