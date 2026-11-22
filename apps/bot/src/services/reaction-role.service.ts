import type { ClientEvents, Events } from "discord.js";
import { prisma } from "@vezbot/database";
import { logger } from "@vezbot/discord";
import { z } from "zod";

type ReactionEvent = ClientEvents[Events.MessageReactionAdd];
const reactionBinding = z.object({ messageId: z.string(), channelId: z.string() });

export async function setReactionRole(
  action: "add" | "remove",
  reaction: ReactionEvent[0],
  user: ReactionEvent[1],
): Promise<void> {
  const guild = reaction.message.guild;
  const emoji = reaction.emoji.id ?? reaction.emoji.name;
  if (!guild || !emoji || user.bot || user.id === reaction.client.user?.id) return;

  const context = { guildId: guild.id, channelId: reaction.message.channelId, messageId: reaction.message.id };
  try {
    const integration = await prisma.integrationConfig.findUnique({
      where: { guildId_provider: { guildId: guild.id, provider: "reaction_roles" } },
    });
    if (!integration?.enabled) return;
    const binding = reactionBinding.safeParse(JSON.parse(integration.config ?? "null"));
    if (!binding.success || binding.data.messageId !== context.messageId
        || binding.data.channelId !== context.channelId) return;

    const menu = await prisma.roleMenu.findFirst({
      where: { ...context, exclusive: false, maxSelections: 0 },
      select: { options: { where: { emoji }, select: { roleId: true } } },
    });
    if (menu?.options.length !== 1) return;

    const roleId = menu.options[0]!.roleId;
    const role = await guild.roles.fetch(roleId);
    if (!role?.editable || role.id === guild.id || role.permissions.bitfield !== 0n) return;
    const member = await guild.members.fetch(user.id);
    if (member.user.bot) return;

    if (action === "add") {
      await member.roles.add(role, "Opted in through a reaction role");
    } else {
      await member.roles.remove(role, "Removed a reaction role");
    }
  } catch (error) {
    logger.warn({ error, ...context, action }, "Could not update reaction role");
  }
}
