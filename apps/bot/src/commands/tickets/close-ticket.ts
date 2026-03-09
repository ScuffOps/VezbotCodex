import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import { successEmbed, errorEmbed, requireUserPermission, safeReply } from "@vezbot/discord";
import { closeTicket } from "../../services/ticket.service";

export const data = new SlashCommandBuilder()
  .setName("close-ticket")
  .setDescription("Close the current ticket")
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for closing").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel) return;

  // Staff or ticket creator can close
  const member = interaction.member as GuildMember;
  const hasModPerms = member.permissions.has(PermissionFlagsBits.ManageChannels);

  // If not a mod, we'll let the service check if they're the ticket creator
  // For safety, require ManageChannels for non-creators
  // (The service validates the channel is actually a ticket)

  const reason = interaction.options.getString("reason") ?? undefined;

  await interaction.deferReply();

  const result = await closeTicket(
    interaction.guild,
    interaction.channel.id,
    member,
    reason
  );

  if (result.success) {
    await interaction.editReply({
      embeds: [successEmbed("Ticket Closing", "This ticket is being closed...")],
    });
  } else {
    await interaction.editReply({
      embeds: [errorEmbed("Cannot Close", result.error ?? "Failed to close ticket.")],
    });
  }
}
