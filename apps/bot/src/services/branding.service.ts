import type { EmbedBuilder } from "discord.js";
import { prisma } from "@vezbot/database";
import { z } from "zod";

const brandingSchema = z.object({
  brandName: z.string().max(80).nullish(),
  footerText: z.string().max(200).nullish(),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).nullish(),
});

export async function applyGuildBranding(guildId: string, embed: EmbedBuilder, custom: { colorHex: string | null; footerText: string | null }) {
  const branding = await prisma.integrationConfig.findUnique({ where: { guildId_provider: { guildId, provider: "branding" } } });
  if (!branding?.enabled || !branding.config) return;
  let stored: unknown;
  try { stored = JSON.parse(branding.config); } catch { return; }
  const parsed = brandingSchema.safeParse(stored);
  if (!parsed.success) return;
  if (!custom.colorHex && parsed.data.accentColor) embed.setColor(parsed.data.accentColor as `#${string}`);
  if (!custom.footerText && (parsed.data.footerText || parsed.data.brandName)) {
    embed.setFooter({ text: parsed.data.footerText || parsed.data.brandName! });
  }
}
