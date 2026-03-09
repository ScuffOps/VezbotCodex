import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

/** Shape of a registered slash command module */
export interface SlashCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** Optional cooldown in seconds */
  cooldown?: number;
}

/** Result shape for service operations */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Per-guild feature toggle map */
export interface FeatureToggles {
  ticketsEnabled: boolean;
  moderationEnabled: boolean;
  roleMenusEnabled: boolean;
  loggingEnabled: boolean;
  onboardingEnabled: boolean;
  integrationsEnabled: boolean;
}

/** Integration provider types */
export type IntegrationProvider =
  | "twitch"
  | "youtube"
  | "twitter"
  | "tiktok"
  | "google_calendar";

/** Log event categories for the logging service */
export type LogCategory =
  | "ticket"
  | "moderation"
  | "member"
  | "role"
  | "config"
  | "integration";
