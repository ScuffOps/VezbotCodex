import { type Client, type EmbedBuilder, type TextChannel } from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger } from "@vezbot/discord";
import type { LogCategory } from "@vezbot/shared";

const log = createLogger({ service: "logging" });

/** Client reference — set once at startup to avoid circular imports */
let _client: Client | null = null;

/** Register the Discord client for use by the logging service. Called once at startup. */
export function setLoggingClient(client: Client): void {
  _client = client;
}

/**
 * Send a log embed to the appropriate log channel for a guild.
 * Silently fails if logging is disabled or channel is missing.
 */
export async function sendLogEmbed(
  guildId: string,
  category: LogCategory,
  embed: EmbedBuilder
): Promise<boolean> {
  if (!_client) return false;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId },
      select: {
        loggingEnabled: true,
        logChannelId: true,
        modLogChannelId: true,
        ticketLogChannelId: true,
      },
    });

    if (!config?.loggingEnabled) return false;

    // Route to category-specific channel, falling back to general log
    let channelId: string | null = null;

    switch (category) {
      case "moderation":
        channelId = config.modLogChannelId ?? config.logChannelId;
        break;
      case "ticket":
        channelId = config.ticketLogChannelId ?? config.logChannelId;
        break;
      default:
        channelId = config.logChannelId;
        break;
    }

    if (!channelId) return false;

    const channel = await _client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isSendable()) return false;

    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    // Logging should never crash the bot
    log.warn({ error, guildId, category }, "Failed to send log embed");
    return false;
  }
}
