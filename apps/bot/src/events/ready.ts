import { Events, ActivityType } from "discord.js";
import { logger } from "@vezbot/discord";
import { Bot } from "@vezbot/shared";
import type { BotClient } from "../lib/client";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: BotClient): Promise<void> {
  logger.info(`Logged in as ${client.user?.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);
  logger.info(`Loaded ${client.commands.size} commands`);

  try {
    if (!client.application) throw new Error("Discord application is unavailable");
    for (const command of client.commands.values()) {
      const payload = command.data.toJSON();
      await client.application.commands.create(payload);
      for (const guild of client.guilds.cache.values()) await guild.commands.create(payload);
    }
    client.commandsSynced = true;
    logger.info({ commands: client.commands.size, guilds: client.guilds.cache.size }, "Slash commands synchronized");
  } catch (error) {
    logger.error({ error }, "Slash command sync failed; bot remains online, retry registration after correcting application permissions");
  }

  // Set bot presence
  client.user?.setPresence({
    activities: [
      {
        name: "your community",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });

  logger.info("╔══════════════════════════════════════════╗");
  logger.info(`║  ${Bot.Name} is online and ready            ║`);
  logger.info("╚══════════════════════════════════════════╝");
}
