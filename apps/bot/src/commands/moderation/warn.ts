import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import { successEmbed, errorEmbed, requireUserPermission, canModerate, safeReply } from "@vezbot/discord";
import { warnMember } from "../../services/moderation.service";

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Issue a warning to a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName("member").setDescription("Member to warn").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the warning").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ModerateMembers,
    "Moderate Members"
  );
  if (!hasPerms) return;

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

  const reason = interaction.options.getString("reason", true);

  await interaction.deferReply({ ephemeral: true });

  const result = await warnMember(
    interaction.guild,
    target,
    interaction.member as GuildMember,
    reason
  );

  if (result.success) {
    await interaction.editReply({
      embeds: [
        successEmbed(
          `Warning Issued — Case #${result.caseNumber}`,
          `**${target.displayName}** has been warned.\n**Reason:** ${reason}`
        ),
      ],
    });
  } else {
    await interaction.editReply({
      embeds: [errorEmbed("Warning Failed", result.error ?? "Could not issue warning.")],
    });
  }
}
