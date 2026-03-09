import { EmbedBuilder } from "discord.js";
import { Colors, Bot } from "@vezbot/shared";

type EmbedVariant = "success" | "error" | "warning" | "info" | "moderation" | "ticket" | "muted";

interface EmbedOptions {
  title?: string;
  description?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  thumbnail?: string;
  image?: string;
  timestamp?: boolean;
  author?: { name: string; iconURL?: string; url?: string };
}

const variantColors: Record<EmbedVariant, number> = {
  success: Colors.Success,
  error: Colors.Error,
  warning: Colors.Warning,
  info: Colors.Info,
  moderation: Colors.Moderation,
  ticket: Colors.Ticket,
  muted: Colors.Muted,
};

/**
 * Creates a themed, branded embed with consistent styling.
 * All bot responses should use this builder for visual consistency.
 */
export function createEmbed(
  variant: EmbedVariant,
  options: EmbedOptions = {}
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(variantColors[variant])
    .setFooter({ text: options.footer ?? Bot.Footer });

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.timestamp !== false) embed.setTimestamp();
  if (options.author) embed.setAuthor(options.author);

  if (options.fields) {
    for (const field of options.fields) {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline ?? false,
      });
    }
  }

  return embed;
}

/** Shorthand: success embed */
export function successEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("success", { title: `✓ ${title}`, description });
}

/** Shorthand: error embed */
export function errorEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("error", { title: `✗ ${title}`, description });
}

/** Shorthand: warning embed */
export function warningEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("warning", { title: `⚠ ${title}`, description });
}

/** Shorthand: info embed */
export function infoEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("info", { title, description });
}

/** Shorthand: moderation action embed */
export function modEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("moderation", { title: `🔨 ${title}`, description });
}

/** Shorthand: ticket embed */
export function ticketEmbed(title: string, description?: string): EmbedBuilder {
  return createEmbed("ticket", { title: `🎫 ${title}`, description });
}
