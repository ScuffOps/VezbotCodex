import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { env } from "@vezbot/config";
import { logger } from "@vezbot/discord";
import type { SlashCommand } from "@vezbot/discord";

function isRuntimeModuleFile(file: string): boolean {
  return (
    (file.endsWith(".ts") && !file.endsWith(".d.ts")) ||
    file.endsWith(".js")
  );
}

/**
 * Standalone script to register all slash commands globally.
 * Run: pnpm register-commands
 *
 * This uses the Discord REST API to PUT all commands.
 * Global commands can take up to 1 hour to propagate.
 * For instant testing, register to a specific guild instead.
 */
async function registerCommands() {
  const argv = process.argv.slice(2);
  const guildFlagIndex = argv.findIndex((arg) => arg === "--guild" || arg === "-g");
  const guildId =
    (guildFlagIndex >= 0 && argv[guildFlagIndex + 1]) ||
    process.env["DISCORD_GUILD_ID"] ||
    null;

  const commandsDir = join(__dirname, "..", "commands");
  const commands: unknown[] = [];

  const categories = readdirSync(commandsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const category of categories) {
    const categoryDir = join(commandsDir, category);
    const files = readdirSync(categoryDir).filter(isRuntimeModuleFile);

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
    if (guildId) {
      logger.info(`Registering ${commands.length} commands for guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), {
        body: commands,
      });
      logger.info(`Successfully registered ${commands.length} commands for guild ${guildId}.`);
    } else {
      logger.info(`Registering ${commands.length} commands globally...`);
      await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
        body: commands,
      });
      logger.info(`Successfully registered ${commands.length} commands globally.`);
    }
  } catch (error) {
    logger.error({ error }, "Failed to register commands");
    process.exit(1);
  }
}

registerCommands();
