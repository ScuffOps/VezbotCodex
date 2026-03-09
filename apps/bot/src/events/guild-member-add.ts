import { Events, type GuildMember } from "discord.js";
import { logger, createEmbed } from "@vezbot/discord";
import { sendLogEmbed } from "../services/logging.service";

export const name = Events.GuildMemberAdd;

export async function execute(member: GuildMember): Promise<void> {
  logger.debug({ guildId: member.guild.id, user: member.user.tag }, "Member joined");

  const embed = createEmbed("success", {
    title: "Member Joined",
    description: `${member} (${member.user.tag})`,
    fields: [
      { name: "Account Created", value: member.user.createdAt.toISOString().split("T")[0]!, inline: true },
      { name: "Member Count", value: `${member.guild.memberCount}`, inline: true },
    ],
    thumbnail: member.user.displayAvatarURL(),
  });

  await sendLogEmbed(member.guild.id, "member", embed);
}
