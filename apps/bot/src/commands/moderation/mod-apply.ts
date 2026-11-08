import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildModal, ModApplicationForm } from "@vezbot/discord";

export const data = new SlashCommandBuilder()
  .setName("mod-apply")
  .setDescription("Open the moderator application form");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const modal = buildModal(ModApplicationForm, interaction.guildId);
  await interaction.showModal(modal);
}
