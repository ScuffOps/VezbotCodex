import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { env } from "@vezbot/config";
import { logger } from "@vezbot/discord";
import type { SlashCommand } from "@vezbot/shared";

/**
 * Standalone script to register all slash commands globally.
 * Run: pnpm register-commands
 *
 * This uses the Discord REST API to PUT all commands.
 * Global commands can take up to 1 hour to propagate.
 * For instant testing, register to a specific guild instead.
 */
async function registerCommands() {
  const commandsDir = join(__dirname, "..", "commands");
  const commands: unknown[] = [];

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
        if (command.data) {
          commands.push(command.data.toJSON());
        }
      } catch (error) {
        logger.error({ error, file: `${category}/${file}` }, "Failed to load command for registration");
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  try {
    logger.info(`Registering ${commands.length} commands globally...`);

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commands,
    });

    logger.info(`Successfully registered ${commands.length} commands.`);
  } catch (error) {
    logger.error({ error }, "Failed to register commands");
    process.exit(1);
  }
}

registerCommands();
