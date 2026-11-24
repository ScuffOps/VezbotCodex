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
    // The runtime command definitions are the source of truth for this application's global commands.
    const commands = client.commands.map(({ data }) => data.toJSON());
    if (commands.length === 0) throw new Error("No slash commands loaded");
    await client.application.commands.set(commands);
    client.commandsSynced = true;
    logger.info({ commands: commands.length }, "Global slash commands synchronized");
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
