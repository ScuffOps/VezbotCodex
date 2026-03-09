import { SlashCommandBuilder, type ChatInputCommandInteraction, version as djsVersion } from "discord.js";
import { createEmbed } from "@vezbot/discord";
import { Bot } from "@vezbot/shared";

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Information about this bot");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client;
  const uptime = formatUptime(client.uptime ?? 0);

  const embed = createEmbed("info", {
    title: Bot.Name,
    description: "A premium multi-server community platform for moderation, tickets, roles, and more.",
    fields: [
      { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
      { name: "Uptime", value: uptime, inline: true },
      { name: "Discord.js", value: `v${djsVersion}`, inline: true },
      { name: "Node.js", value: process.version, inline: true },
    ],
    thumbnail: client.user?.displayAvatarURL() ?? undefined,
  });

  await interaction.reply({ embeds: [embed] });
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
