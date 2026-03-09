import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import { successEmbed, errorEmbed, requireUserPermission, requireBotPermission, canModerate, safeReply } from "@vezbot/discord";
import { timeoutMember } from "../../services/moderation.service";

const DURATION_CHOICES = [
  { name: "60 seconds", value: 60 },
  { name: "5 minutes", value: 300 },
  { name: "10 minutes", value: 600 },
  { name: "1 hour", value: 3600 },
  { name: "1 day", value: 86400 },
  { name: "1 week", value: 604800 },
] as const;

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Timeout a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName("member").setDescription("Member to timeout").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("duration")
      .setDescription("Timeout duration")
      .setRequired(true)
      .addChoices(...DURATION_CHOICES.map((c) => ({ name: c.name, value: c.value })))
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the timeout").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ModerateMembers,
    "Moderate Members"
  );
  if (!hasPerms) return;

  const hasBotPerms = await requireBotPermission(
    interaction,
    PermissionFlagsBits.ModerateMembers,
    "Moderate Members"
  );
  if (!hasBotPerms) return;

  const target = interaction.options.getMember("member") as GuildMember | null;
  if (!target) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Member Not Found", "Could not find that member in this server.")],
      ephemeral: true,
    });
    return;
  }

  const canAct = await canModerate(interaction, target);
  if (!canAct) return;

  const duration = interaction.options.getInteger("duration", true);
  const reason = interaction.options.getString("reason", true);

  await interaction.deferReply({ ephemeral: true });

  const result = await timeoutMember(
    interaction.guild,
    target,
    interaction.member as GuildMember,
    duration,
    reason
  );

  if (result.success) {
    await interaction.editReply({
      embeds: [
        successEmbed(
          `Timeout Applied — Case #${result.caseNumber}`,
          `**${target.displayName}** has been timed out.\n**Reason:** ${reason}`
        ),
      ],
    });
  } else {
    await interaction.editReply({
      embeds: [errorEmbed("Timeout Failed", result.error ?? "Could not timeout member.")],
    });
  }
}
