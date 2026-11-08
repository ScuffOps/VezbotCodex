import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@vezbot/database";
import { validateTimezone } from "@vezbot/shared";

export const data = new SlashCommandBuilder().setName("timezone").setDescription("Set your scheduling timezone")
  .addSubcommand(sub => sub.setName("set").setDescription("Save your IANA timezone")
    .addStringOption(option => option.setName("zone").setDescription("Example: America/Los_Angeles").setRequired(true).setMaxLength(80)));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const timezone = validateTimezone(interaction.options.getString("zone", true));
    await prisma.userPreference.upsert({ where: { userId: interaction.user.id }, update: { timezone }, create: { userId: interaction.user.id, timezone } });
    await interaction.editReply(`Your scheduling timezone is now ${timezone}.`);
  } catch {
    await interaction.editReply("Could not save your timezone. Use an IANA zone such as America/Los_Angeles.");
  }
}
