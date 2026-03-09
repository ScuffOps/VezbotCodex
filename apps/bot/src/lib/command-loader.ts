import { readdirSync } from "fs";
import { join } from "path";
import { logger } from "@vezbot/discord";
import type { BotClient } from "./client";
import type { SlashCommand } from "@vezbot/shared";

/**
 * Recursively load all command files from the commands/ directory.
 * Each file must export `data` (SlashCommandBuilder) and `execute` (handler).
 */
export async function loadCommands(client: BotClient): Promise<void> {
  const commandsDir = join(__dirname, "..", "commands");
  let loaded = 0;

  const categories = readdirSync(commandsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const category of categories) {
    const categoryDir = join(commandsDir, category);
    const files = readdirSync(categoryDir).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );

    for (const file of files) {
      try {
        const filePath = join(categoryDir, file);
        const command = require(filePath) as SlashCommand;

        if (!command.data || !command.execute) {
          logger.warn(`Command file ${category}/${file} is missing data or execute export. Skipping.`);
          continue;
        }

        client.commands.set(command.data.name, command);
        loaded++;
      } catch (error) {
        logger.error({ error, file: `${category}/${file}` }, "Failed to load command");
      }
    }
  }

  logger.info(`Loaded ${loaded} commands`);
}

/**
 * Load all event files from the events/ directory.
 * Each file must export `name` (event name) and `execute` (handler).
 * Optionally export `once: true` for one-time events.
 */
export async function loadEvents(client: BotClient): Promise<void> {
  const eventsDir = join(__dirname, "..", "events");
  let loaded = 0;

  const files = readdirSync(eventsDir).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of files) {
    try {
      const filePath = join(eventsDir, file);
      const event = require(filePath) as {
        name: string;
        once?: boolean;
        execute: (...args: unknown[]) => void;
      };

      if (!event.name || !event.execute) {
        logger.warn(`Event file ${file} is missing name or execute export. Skipping.`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      loaded++;
    } catch (error) {
      logger.error({ error, file }, "Failed to load event");
    }
  }

  logger.info(`Loaded ${loaded} events`);
}
