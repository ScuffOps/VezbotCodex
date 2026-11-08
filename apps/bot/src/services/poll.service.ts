import { ChannelType, PermissionFlagsBits, type Client, type Guild } from "discord.js";
import { prisma } from "@vezbot/database";
import { z } from "zod";
import { createLogger } from "@vezbot/discord";

const log = createLogger({ service: "polls" });

const optionsSchema = z.array(z.string().trim().min(1).max(55)).min(2).max(10);

export async function setLivePollStatus(guild: Guild, pollId: string, status: "DRAFT" | "ACTIVE" | "CLOSED") {
  const poll = await prisma.poll.findFirst({ where: { id: pollId, guildId: guild.id } });
  if (!poll) throw new Error("Poll not found in this server.");
  if (status === "DRAFT") {
    if (poll.messageId || poll.status === "PUBLISHING") throw new Error("A published poll cannot return to draft.");
    await prisma.poll.update({ where: { id: poll.id }, data: { status } });
    return;
  }
  if (!poll.channelId) throw new Error("Set a target channel first.");
  const channel = await guild.channels.fetch(poll.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Choose a text channel in this server.");
  if (status === "CLOSED") {
    if (poll.messageId) {
      const message = await channel.messages.fetch(poll.messageId);
      if (message.poll && !message.poll.resultsFinalized) await message.poll.end();
    }
    await prisma.poll.update({ where: { id: poll.id }, data: { status } });
    return;
  }
  if (poll.messageId) return;
  if (poll.anonymous) throw new Error("Discord native polls expose voters; anonymous polls are not supported yet.");
  const answers = optionsSchema.parse(JSON.parse(poll.optionsJson)).map(text => ({ text }));
  const remaining = (poll.closesAt?.getTime() ?? Date.now() + 86_400_000) - Date.now();
  if (remaining <= 0 || remaining > 32 * 86_400_000) throw new Error("Poll closing time must be within the next 32 days.");
  const bot = guild.members.me ?? await guild.members.fetchMe();
  if (!channel.permissionsFor(bot).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendPolls])) {
    throw new Error("The bot needs View Channel, Send Messages, and Send Polls in that channel.");
  }
  const claimed = await prisma.poll.updateMany({ where: { id: poll.id, guildId: guild.id, status: "DRAFT", messageId: null }, data: { status: "PUBLISHING" } });
  if (!claimed.count) throw new Error("This poll is already publishing or is not a draft.");
  let message;
  try {
    message = await channel.send({
      poll: { question: { text: poll.question }, answers, duration: Math.max(1, Math.ceil(remaining / 3_600_000)), allowMultiselect: poll.allowMulti },
      nonce: poll.id, enforceNonce: true, allowedMentions: { parse: [] },
    });
  } catch (error) {
    await prisma.poll.updateMany({ where: { id: poll.id, status: "PUBLISHING" }, data: { status: "DRAFT" } });
    throw error;
  }
  await prisma.poll.update({ where: { id: poll.id }, data: { status: "ACTIVE", messageId: message.id, closesAt: poll.closesAt ?? new Date(Date.now() + 86_400_000) } });
}

export async function closeDuePolls(client: Client) {
  const polls = await prisma.poll.findMany({ where: { status: "ACTIVE", closesAt: { lte: new Date() } }, take: 20, orderBy: { closesAt: "asc" } });
  for (const poll of polls) {
    try {
      const guild = await client.guilds.fetch(poll.guildId);
      await setLivePollStatus(guild, poll.id, "CLOSED");
    } catch {
      log.warn({ pollId: poll.id }, "Could not close scheduled poll; will retry");
    }
  }
}
