import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createEmbed, errorEmbed, requireUserPermission, safeReply } from "@vezbot/discord";
import { getCaseHistory, getCase } from "../../services/moderation.service";

export const data = new SlashCommandBuilder()
  .setName("case")
  .setDescription("View moderation case history")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addSubcommand((sub) =>
    sub
      .setName("history")
      .setDescription("View case history for a user")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to check").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("view")
      .setDescription("View a specific case")
      .addIntegerOption((opt) =>
        opt.setName("number").setDescription("Case number").setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ModerateMembers,
    "Moderate Members"
  );
  if (!hasPerms) return;

  const sub = interaction.options.getSubcommand();

  if (sub === "history") {
    const user = interaction.options.getUser("user", true);
    const cases = await getCaseHistory(interaction.guildId, user.id);

    if (cases.length === 0) {
      await safeReply(interaction, {
        embeds: [createEmbed("info", {
          title: `Case History — ${user.tag}`,
          description: "No moderation cases found for this user.",
        })],
        ephemeral: true,
      });
      return;
    }

    const lines = cases.map((c) => {
      const date = c.createdAt.toISOString().split("T")[0];
      return `**#${c.caseNumber}** \`${c.type}\` — ${c.reason ?? "No reason"} (${date})`;
    });

    await safeReply(interaction, {
      embeds: [createEmbed("moderation", {
        title: `Case History — ${user.tag}`,
        description: lines.join("\n"),
      })],
      ephemeral: true,
    });
  }

  if (sub === "view") {
    const caseNumber = interaction.options.getInteger("number", true);
    const caseData = await getCase(interaction.guildId, caseNumber);

    if (!caseData) {
      await safeReply(interaction, {
        embeds: [errorEmbed("Not Found", `Case #${caseNumber} does not exist.`)],
        ephemeral: true,
      });
      return;
    }

    await safeReply(interaction, {
      embeds: [createEmbed("moderation", {
        title: `Case #${caseData.caseNumber}`,
        fields: [
          { name: "Type", value: caseData.type, inline: true },
          { name: "Target", value: `<@${caseData.targetId}>`, inline: true },
          { name: "Moderator", value: `<@${caseData.moderatorId}>`, inline: true },
          { name: "Reason", value: caseData.reason ?? "No reason provided" },
          ...(caseData.duration
            ? [{ name: "Duration", value: `${caseData.duration}s`, inline: true }]
            : []),
          { name: "Date", value: caseData.createdAt.toISOString() },
        ],
      })],
      ephemeral: true,
    });
  }
}
