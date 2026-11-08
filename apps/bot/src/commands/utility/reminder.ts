import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@vezbot/database";
import { parseSchedule } from "@vezbot/shared";

export const data = new SlashCommandBuilder().setName("reminder").setDescription("Schedule and list personal reminders")
  .addSubcommand(sub => sub.setName("set").setDescription("Schedule a reminder")
    .addStringOption(o => o.setName("when").setDescription("YYYY-MM-DDTHH:mm in your saved timezone, or add an offset").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("What to remind you about").setRequired(true).setMaxLength(1800))
    .addChannelOption(o => o.setName("channel").setDescription("Optional server channel; otherwise sends a DM").addChannelTypes(ChannelType.GuildText)))
  .addSubcommand(sub => sub.setName("list").setDescription("List your next 10 unsent reminders"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  if (interaction.options.getSubcommand() === "list") {
    const reminders = await prisma.reminder.findMany({ where: { userId: interaction.user.id, sent: false }, orderBy: { remindAt: "asc" }, take: 10 });
    await interaction.editReply(reminders.length ? reminders.map(r => `<t:${Math.floor(r.remindAt.getTime() / 1000)}:f> - ${r.message.slice(0, 100)}`).join("\n") : "No pending reminders.");
    return;
  }
  try {
    const channel = interaction.options.getChannel("channel");
    if (channel && (!interaction.guildId || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))) {
      await interaction.editReply("Manage Server permission is required to schedule channel announcements. Omit channel for a personal DM reminder.");
      return;
    }
    const preferences = await prisma.userPreference.findUnique({ where: { userId: interaction.user.id } });
    const timezone = preferences?.timezone ?? "UTC";
    const remindAt = parseSchedule(interaction.options.getString("when", true), timezone);
    const message = interaction.options.getString("message", true).trim();
    if (!message) throw new Error("Enter a reminder message.");
    await prisma.reminder.create({ data: { userId: interaction.user.id, guildId: interaction.guildId, channelId: channel?.id, message, timezone, remindAt } });
    await interaction.editReply(`Reminder scheduled for <t:${Math.floor(remindAt.getTime() / 1000)}:f> (${timezone}).`);
  } catch (error) {
    await interaction.editReply(error instanceof Error && !('code' in error) ? error.message : "Could not save your reminder. Please try again.");
  }
}
