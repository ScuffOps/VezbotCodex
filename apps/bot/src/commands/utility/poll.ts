import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@vezbot/database";
import { z } from "zod";
import { getOrCreateGuildConfig } from "../../services/guild-config.service";
import { setLivePollStatus } from "../../services/poll.service";

export const data = new SlashCommandBuilder().setName("poll").setDescription("Create a live Discord poll")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub => sub.setName("create").setDescription("Post a single- or multi-select poll")
    .addStringOption(o => o.setName("question").setDescription("Poll question").setRequired(true).setMaxLength(300))
    .addStringOption(o => o.setName("options").setDescription("2-10 options separated by | (max 55 characters each)").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Target text channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addIntegerOption(o => o.setName("hours").setDescription("Duration in hours").setMinValue(1).setMaxValue(768))
    .addBooleanOption(o => o.setName("multiple").setDescription("Allow multiple answers")));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "Manage Server permission is required.", ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const options = z.array(z.string().trim().min(1).max(55)).min(2).max(10).parse(interaction.options.getString("options", true).split("|"));
    if (new Set(options.map(x => x.toLowerCase())).size !== options.length) throw new Error("Options must be distinct.");
    await getOrCreateGuildConfig(interaction.guild.id);
    const poll = await prisma.poll.create({ data: {
      guildId: interaction.guild.id, creatorId: interaction.user.id,
      question: interaction.options.getString("question", true), optionsJson: JSON.stringify(options),
      channelId: interaction.options.getChannel("channel", true).id,
      closesAt: new Date(Date.now() + (interaction.options.getInteger("hours") ?? 24) * 3_600_000),
      allowMulti: interaction.options.getBoolean("multiple") ?? false,
    } });
    await setLivePollStatus(interaction.guild, poll.id, "ACTIVE");
    await interaction.editReply("Your poll is live. You can view and close it from the dashboard.");
  } catch {
    await interaction.editReply("Could not publish the poll. Use 2-10 distinct options of at most 55 characters and a channel where the bot can send polls. Any saved draft is available in the dashboard.");
  }
}
