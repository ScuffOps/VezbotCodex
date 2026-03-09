import { Events, type Guild } from "discord.js";
import { logger } from "@vezbot/discord";
import { getOrCreateGuildConfig } from "../services/guild-config.service";

export const name = Events.GuildCreate;

export async function execute(guild: Guild): Promise<void> {
  logger.info({ guildId: guild.id, guildName: guild.name }, "Joined new guild");

  // Auto-initialize guild config on join
  try {
    await getOrCreateGuildConfig(guild.id);
    logger.info({ guildId: guild.id }, "Guild config initialized");
  } catch (error) {
    logger.error({ error, guildId: guild.id }, "Failed to initialize guild config");
  }
}
