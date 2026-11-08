import { ChannelType, type Client } from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger } from "@vezbot/discord";
import { closeDuePolls } from "./poll.service";

const log = createLogger({ service: "scheduler" });

export function startScheduler(client: Client): () => void {
  let running = false;
  let stopped = false;
  async function tick() {
    if (running || stopped || !client.isReady()) return;
    running = true;
    try {
      const cutoff = new Date(Date.now() - 5 * 60_000);
      const where = { sent: false, remindAt: { lte: new Date() }, attempts: { lt: 5 }, OR: [{ claimedAt: null }, { claimedAt: { lt: cutoff } }] };
      const reminders = await prisma.reminder.findMany({ where, take: 20, orderBy: { remindAt: "asc" } });
      for (const reminder of reminders) {
        if (stopped) break;
        const claim = await prisma.reminder.updateMany({ where: { ...where, id: reminder.id }, data: { claimedAt: new Date(), attempts: { increment: 1 } } });
        if (!claim.count) continue;
        try {
          const payload = { content: `Reminder for <@${reminder.userId}>\n${reminder.message}`, allowedMentions: { parse: [] as [], users: [reminder.userId] }, nonce: reminder.id, enforceNonce: true };
          if (reminder.channelId) {
            if (!reminder.guildId) throw new Error("Channel reminder has no server.");
            const guild = await client.guilds.fetch(reminder.guildId);
            const channel = await guild.channels.fetch(reminder.channelId);
            if (!channel || channel.type !== ChannelType.GuildText) throw new Error("Reminder channel is unavailable.");
            await guild.members.fetch(reminder.userId);
            await channel.send(payload);
          } else {
            const user = await client.users.fetch(reminder.userId);
            await user.send(payload);
          }
          await prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true, claimedAt: null, lastError: null } });
          log.info({ reminderId: reminder.id }, "Reminder delivered");
        } catch {
          await prisma.reminder.update({ where: { id: reminder.id }, data: { lastError: "Delivery failed. Check channel permissions, membership, or DM availability." } });
          log.warn({ reminderId: reminder.id }, "Reminder delivery failed; retry is delayed five minutes (maximum five attempts)");
        }
      }
    } catch (error) {
      log.error({ error }, "Reminder scheduler failed");
    }
    try { await closeDuePolls(client); } catch (error) { log.warn({ error }, "Scheduled poll closure failed; will retry"); }
    running = false;
  }
  const timer = setInterval(() => { void tick(); }, 15_000);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
