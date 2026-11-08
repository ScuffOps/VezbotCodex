import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { infoEmbed } from "@vezbot/discord";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Show setup shortcuts for Vezbot_FIN");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    embeds: [
      infoEmbed(
        "Setup Shortcuts",
        [
          "Use these commands to configure the bot:",
          "",
          "- `/setup-tickets` to configure ticket category and logs",
          "- `/setup-roles` to create a reaction-role menu",
          "- `/embed create` to start a reusable embed template",
          "- `/mod-apply` to open the moderator application modal",
          "- `/server-config view` to inspect current guild settings",
          "- `/ping` to verify responsiveness",
        ].join("\n")
      ),
    ],
    ephemeral: true,
  });
}
