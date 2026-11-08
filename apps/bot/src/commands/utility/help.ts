import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "@vezbot/discord";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show the command quickstart");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = createEmbed("info", {
    title: "Vezbot Command Quickstart",
    description: "Core commands to get your server configured quickly.",
    fields: [
      {
        name: "Setup",
        value: [
          "`/setup`",
          "`/setup-tickets`",
          "`/setup-roles`",
          "`/server-config view`",
        ].join("\n"),
      },
      {
        name: "Embeds",
        value: [
          "`/embed create`",
          "`/embed list`",
          "`/embed show`",
          "`/embed send`",
          "`/embed edit ...`",
        ].join("\n"),
      },
      {
        name: "Moderation",
        value: [
          "`/warn`",
          "`/timeout`",
          "`/report`",
          "`/case`",
        ].join("\n"),
        inline: true,
      },
      {
        name: "Scheduling and Polls",
        value: "`/timezone set`\n`/reminder set`\n`/reminder list`\n`/poll create`",
      },
      {
        name: "Utility",
        value: [
          "`/ping`",
          "`/about`",
          "`/invite`",
        ].join("\n"),
        inline: true,
      },
    ],
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

