import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { successEmbed, errorEmbed, requireUserPermission, requireBotPermission, safeReply } from "@vezbot/discord";
import { updateGuildConfig } from "../../services/guild-config.service";

export const data = new SlashCommandBuilder()
  .setName("setup-tickets")
  .setDescription("Configure the ticket system for this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("category")
      .setDescription("Category channel where tickets will be created")
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true)
  )
  .addChannelOption((opt) =>
    opt
      .setName("log-channel")
      .setDescription("Channel where ticket logs will be sent")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ManageGuild,
    "Manage Server"
  );
  if (!hasPerms) return;

  const hasBotPerms = await requireBotPermission(
    interaction,
    PermissionFlagsBits.ManageChannels,
    "Manage Channels"
  );
  if (!hasBotPerms) return;

  const category = interaction.options.getChannel("category", true);
  const logChannel = interaction.options.getChannel("log-channel", false);

  try {
    await updateGuildConfig(interaction.guildId, {
      ticketCategoryId: category.id,
      ticketsEnabled: true,
      ...(logChannel ? { ticketLogChannelId: logChannel.id } : {}),
    });

    await safeReply(interaction, {
      embeds: [
        successEmbed(
          "Ticket System Configured",
          [
            `**Category:** <#${category.id}>`,
            logChannel ? `**Log Channel:** <#${logChannel.id}>` : "",
            "",
            "The ticket system is now enabled. Users can create tickets with `/ticket` or via a ticket panel button.",
          ]
            .filter(Boolean)
            .join("\n")
        ),
      ],
      ephemeral: true,
    });
  } catch {
    await safeReply(interaction, {
      embeds: [errorEmbed("Setup Failed", "Could not configure the ticket system. Please try again.")],
      ephemeral: true,
    });
  }
}
