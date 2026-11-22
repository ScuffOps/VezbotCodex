import { MessageFlags, type ButtonInteraction } from "discord.js";
import { prisma } from "@vezbot/database";
import { z } from "zod";

export const VERIFY_BUTTON_ID = "member-verify";
const snowflake = z.string().regex(/^\d{17,20}$/);
const verificationSettings = z.object({
  verificationChannelId: snowflake,
  verificationMessageId: snowflake,
  verifiedRoleId: snowflake,
});

export async function verifyMember(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  if (!guild || interaction.user.bot || interaction.message.author.id !== interaction.client.user.id) {
    await interaction.editReply("This verification button is unavailable.");
    return;
  }

  const integration = await prisma.integrationConfig.findUnique({
    where: { guildId_provider: { guildId: guild.id, provider: "verification" } },
  });
  const settings = verificationSettings.safeParse(JSON.parse(integration?.config ?? "null"));
  if (!integration?.enabled || !settings.success
      || settings.data.verificationChannelId !== interaction.channelId
      || settings.data.verificationMessageId !== interaction.message.id) {
    await interaction.editReply("This verification button is unavailable.");
    return;
  }

  const role = await guild.roles.fetch(settings.data.verifiedRoleId);
  if (!role?.editable || role.id === guild.id || role.permissions.bitfield !== 0n) {
    await interaction.editReply("I couldn’t grant the Verified role. Please let a moderator know.");
    return;
  }

  const member = await guild.members.fetch(interaction.user.id);
  await member.roles.add(role, "Verified through the server rules card");
  await interaction.editReply("You’re verified. Welcome to the Shrine! ♡");
}
