import {
  Events,
  type Interaction,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type GuildMember,
} from "discord.js";
import {
  logger,
  errorEmbed,
  safeReply,
  parseFormCustomId,
  extractFormValues,
  TicketCreateForm,
  TicketCloseForm,
  ReportForm,
  ModApplicationForm,
  ticketCreateSchema,
  reportSchema,
  successEmbed,
  modEmbed,
} from "@vezbot/discord";
import type { BotClient } from "../lib/client";
import { createTicket, closeTicket } from "../services/ticket.service";
import { toggleRole } from "../services/role.service";
import { sendLogEmbed } from "../services/logging.service";
import { prisma } from "@vezbot/database";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      logger.info({
        interactionType: "chat-input",
        command: interaction.commandName,
        commandId: interaction.commandId,
        applicationId: interaction.applicationId,
        guildId: interaction.guildId,
        user: interaction.user.tag,
      }, "Received chat input interaction");
      await handleCommand(interaction);
    } else if (interaction.isButton()) {
      logger.info({
        interactionType: "button",
        customId: interaction.customId,
        applicationId: interaction.applicationId,
        guildId: interaction.guildId,
        user: interaction.user.tag,
      }, "Received button interaction");
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      logger.info({
        interactionType: "modal-submit",
        customId: interaction.customId,
        applicationId: interaction.applicationId,
        guildId: interaction.guildId,
        user: interaction.user.tag,
      }, "Received modal interaction");
      await handleModal(interaction);
    }
  } catch (error) {
    logger.error({ error, type: interaction.type }, "Unhandled interaction error");

    // Try to respond with a generic error
    try {
      const replyable = interaction as ChatInputCommandInteraction;
      if ("reply" in replyable) {
        const embed = errorEmbed("Something went wrong", "An unexpected error occurred. Please try again.");
        if (replyable.replied || replyable.deferred) {
          await replyable.followUp({ embeds: [embed], ephemeral: true });
        } else {
          await replyable.reply({ embeds: [embed], ephemeral: true });
        }
      }
    } catch {
      // Interaction expired — nothing we can do
    }
  }
}

// ── Command Handler ────────────────────────

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client as BotClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn({ command: interaction.commandName }, "Unknown command received");
    await safeReply(interaction, {
      embeds: [
        errorEmbed(
          "Unknown command",
          "This command is not available on the current bot build. Try /ping, /setup, /setup-tickets, /setup-roles, or /server-config view."
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  logger.info({
    command: interaction.commandName,
    user: interaction.user.tag,
    guild: interaction.guildId,
  }, "Command executed");

  await command.execute(interaction);
}

// ── Button Handler ─────────────────────────

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;

  // Role toggle buttons: role-toggle:{roleId}
  if (customId.startsWith("role-toggle:")) {
    const roleId = customId.split(":")[1];
    if (!roleId || !interaction.guild) return;

    const configuredMenu = await prisma.roleMenu.findFirst({
      where: { guildId: interaction.guild.id, messageId: interaction.message.id, channelId: interaction.channelId, options: { some: { roleId } } },
      select: { id: true },
    });
    if (!configuredMenu) {
      await interaction.reply({ content: "This role button is not part of an active saved role menu.", ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    const result = await toggleRole(interaction.guild, member, roleId);

    if (result.success) {
      await interaction.reply({
        embeds: [
          successEmbed(
            `Role ${result.action === "added" ? "Added" : "Removed"}`,
            `**${result.roleName}** has been ${result.action}.`
          ),
        ],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [errorEmbed("Role Update Failed", result.error ?? "Could not update role.")],
        ephemeral: true,
      });
    }
    return;
  }

  // Ticket close buttons: ticket-close:{channelId}
  if (customId.startsWith("ticket-create:")) {
    if (!interaction.guild) return;

    const { buildModal } = await import("@vezbot/discord");
    const modal = buildModal(TicketCreateForm, interaction.guild.id);
    await interaction.showModal(modal);
    return;
  }

  // Ticket close buttons: ticket-close:{channelId}
  if (customId.startsWith("ticket-close:")) {
    if (!interaction.guild) return;

    // Show the close reason modal
    const { buildModal } = await import("@vezbot/discord");
    const modal = buildModal(TicketCloseForm, interaction.channel?.id ?? "unknown");
    await interaction.showModal(modal);
    return;
  }

  logger.warn({ customId }, "Unhandled button interaction");
}

// ── Modal Handler ──────────────────────────

async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  const parsed = parseFormCustomId(interaction.customId);
  if (!parsed) return;

  const { formId, contextId } = parsed;

  switch (formId) {
    case "ticket-create": {
      if (!interaction.guild) return;

      const values = extractFormValues(interaction, TicketCreateForm.fields);
      const validated = ticketCreateSchema.safeParse(values);

      if (!validated.success) {
        await interaction.reply({
          embeds: [errorEmbed("Invalid Input", "Please fill in all required fields correctly.")],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await createTicket(
        interaction.guild,
        interaction.member as GuildMember,
        validated.data.subject,
        validated.data.description
      );

      if (result.success) {
        await interaction.editReply({
          embeds: [
            successEmbed(
              "Ticket Created",
              `Your ticket has been created in <#${result.channelId}>.`
            ),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [errorEmbed("Ticket Failed", result.error ?? "Could not create ticket.")],
        });
      }
      break;
    }

    case "ticket-close": {
      if (!interaction.guild || !interaction.channel) return;

      const values = extractFormValues(interaction, TicketCloseForm.fields);
      const reason = values["reason"] || undefined;

      await interaction.deferReply();

      const result = await closeTicket(
        interaction.guild,
        interaction.channel.id,
        interaction.member as GuildMember,
        reason
      );

      if (result.success) {
        await interaction.editReply({
          embeds: [successEmbed("Ticket Closing", "This ticket is being closed...")],
        });
      } else {
        await interaction.editReply({
          embeds: [errorEmbed("Cannot Close", result.error ?? "Failed to close ticket.")],
        });
      }
      break;
    }

    case "report": {
      if (!interaction.guild) return;

      const values = extractFormValues(interaction, ReportForm.fields);
      const validated = reportSchema.safeParse(values);

      if (!validated.success) {
        await interaction.reply({
          embeds: [errorEmbed("Invalid Report", "Please fill in all required fields.")],
          ephemeral: true,
        });
        return;
      }

      // Send report to mod log channel
      const reportEmbed = modEmbed("User Report Received", [
        `**Reported by:** ${interaction.user} (${interaction.user.tag})`,
        `**Reported user:** ${validated.data.reported_user}`,
        `**Reason:** ${validated.data.reason}`,
        validated.data.evidence ? `**Evidence:** ${validated.data.evidence}` : "",
      ].filter(Boolean).join("\n"));

      await interaction.deferReply({ ephemeral: true });
      const delivered = await sendLogEmbed(interaction.guild.id, "moderation", reportEmbed);
      if (!delivered) {
        await interaction.editReply({ embeds: [errorEmbed("Report Not Delivered", "Staff logging is unavailable. Please contact a moderator directly.")] });
        break;
      }
      await interaction.editReply({
        embeds: [
          successEmbed(
            "Report Submitted",
            "Your report has been sent to the moderation team. Thank you for helping keep this community safe."
          ),
        ],
      });
      break;
    }

    case "mod-application": {
      if (!interaction.guild) return;

      const values = extractFormValues(interaction, ModApplicationForm.fields);
      const experience = values["experience"]?.trim();
      const availability = values["availability"]?.trim();
      const motivation = values["motivation"]?.trim();

      if (!experience || !availability || !motivation) {
        await interaction.reply({
          embeds: [errorEmbed("Invalid Application", "Please complete all moderator application fields.")],
          ephemeral: true,
        });
        return;
      }

      const applicationEmbed = modEmbed("Moderator Application Received", [
        `**Applicant:** ${interaction.user} (${interaction.user.tag})`,
        `**Experience:** ${experience}`,
        `**Availability:** ${availability}`,
        `**Motivation:** ${motivation}`,
      ].join("\n"));

      await interaction.deferReply({ ephemeral: true });
      const delivered = await sendLogEmbed(interaction.guild.id, "moderation", applicationEmbed);
      if (!delivered) {
        await interaction.editReply({ embeds: [errorEmbed("Application Not Delivered", "Staff logging is unavailable. Please contact a moderator directly.")] });
        break;
      }
      await interaction.editReply({
        embeds: [
          successEmbed(
            "Application Submitted",
            "Your moderator application has been sent to staff for review."
          ),
        ],
      });
      break;
    }

    default:
      logger.warn({ formId }, "Unhandled form submission");
  }
}
