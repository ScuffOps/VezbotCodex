import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildModal, TicketCreateForm, errorEmbed, safeReply } from "@vezbot/discord";
import { isFeatureEnabled } from "../../services/guild-config.service";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Create a support ticket");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const enabled = await isFeatureEnabled(interaction.guildId, "ticketsEnabled");
  if (!enabled) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Tickets Disabled", "The ticket system is not enabled in this server. An admin can enable it with `/setup-tickets`.")],
      ephemeral: true,
    });
    return;
  }

  // Show the ticket creation modal
  const modal = buildModal(TicketCreateForm, interaction.guildId);
  await interaction.showModal(modal);
}
