import {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
} from "discord.js";
import type { SlashCommand } from "@vezbot/discord";

/** Extended Discord.js Client with typed command collection */
export interface BotClient extends Client {
  commands: Collection<string, SlashCommand>;
  commandsSynced: boolean;
}

export function createBotClient(): BotClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Channel,
      Partials.GuildMember,
      Partials.Message,
    ],
  }) as BotClient;

  client.commands = new Collection();
  client.commandsSynced = false;

  return client;
}
