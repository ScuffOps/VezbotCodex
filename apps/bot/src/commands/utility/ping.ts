import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { infoEmbed } from "@vezbot/discord";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check bot latency and responsiveness");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sent = await interaction.reply({
    embeds: [infoEmbed("Pinging...", "Measuring latency...")],
    fetchReply: true,
  });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsLatency = interaction.client.ws.ping;

  await interaction.editReply({
    embeds: [
      infoEmbed("Pong!", [
        `**Roundtrip:** ${roundtrip}ms`,
        `**WebSocket:** ${wsLatency}ms`,
      ].join("\n")),
    ],
  });
}
