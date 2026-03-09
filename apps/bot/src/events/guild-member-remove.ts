import { Events, type GuildMember, type PartialGuildMember } from "discord.js";
import { logger, createEmbed } from "@vezbot/discord";
import { sendLogEmbed } from "../services/logging.service";

export const name = Events.GuildMemberRemove;

export async function execute(member: GuildMember | PartialGuildMember): Promise<void> {
  logger.debug({ guildId: member.guild.id, user: member.user?.tag }, "Member left");

  const embed = createEmbed("error", {
    title: "Member Left",
    description: `${member.user?.tag ?? "Unknown"} (${member.id})`,
    fields: [
      { name: "Member Count", value: `${member.guild.memberCount}`, inline: true },
    ],
    thumbnail: member.user?.displayAvatarURL(),
  });

  await sendLogEmbed(member.guild.id, "member", embed);
}
