import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "@vezbot/discord";
import { env } from "@vezbot/config";
import { Bot } from "@vezbot/shared";

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Get the bot invite link");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const scopes = encodeURIComponent("bot applications.commands");
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&permissions=${Bot.InvitePermissions}&scope=${scopes}`;

  const embed = createEmbed("info", {
    title: "Invite Vezbot_FIN",
    description: `[Click here to invite Vezbot_FIN](${inviteUrl})`,
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

