import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildModal, ReportForm } from "@vezbot/discord";

export const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a user or issue to the moderation team");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const modal = buildModal(ReportForm, interaction.guildId);
  await interaction.showModal(modal);
}
