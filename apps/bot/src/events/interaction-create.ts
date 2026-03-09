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
  ticketCreateSchema,
  reportSchema,
  successEmbed,
  modEmbed,
} from "@vezbot/discord";
import type { BotClient } from "../lib/client";
import { createTicket, closeTicket } from "../services/ticket.service";
import { toggleRole } from "../services/role.service";
import { sendLogEmbed } from "../services/logging.service";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
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

      await sendLogEmbed(interaction.guild.id, "moderation", reportEmbed);

      await interaction.reply({
        embeds: [
          successEmbed(
            "Report Submitted",
            "Your report has been sent to the moderation team. Thank you for helping keep this community safe."
          ),
        ],
        ephemeral: true,
      });
      break;
    }

    default:
      logger.warn({ formId }, "Unhandled form submission");
  }
}
