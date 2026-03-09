import { Events, ActivityType } from "discord.js";
import { logger } from "@vezbot/discord";
import { Bot } from "@vezbot/shared";
import type { BotClient } from "../lib/client";

export const name = Events.ClientReady;
export const once = true;

export function execute(client: BotClient): void {
  logger.info(`Logged in as ${client.user?.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);
  logger.info(`Loaded ${client.commands.size} commands`);

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
