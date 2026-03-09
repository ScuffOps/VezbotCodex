import { prisma } from "@vezbot/database";
import type { GuildConfig } from "@vezbot/database";
import { createLogger } from "@vezbot/discord";

const log = createLogger({ service: "guild-config" });

/**
 * Get or create a guild config record.
 * Called automatically on guildCreate and on-demand.
 */
export async function getOrCreateGuildConfig(guildId: string): Promise<GuildConfig> {
  const existing = await prisma.guildConfig.findUnique({
    where: { guildId },
  });

  if (existing) return existing;

  log.info({ guildId }, "Initializing new guild config");

  return prisma.guildConfig.create({
    data: { guildId },
  });
}

/**
 * Get guild config — returns null if not found (no auto-create).
 */
export async function getGuildConfig(guildId: string): Promise<GuildConfig | null> {
  return prisma.guildConfig.findUnique({
    where: { guildId },
  });
}

/**
 * Update guild config with partial data.
 * Ensures the config exists first.
 */
export async function updateGuildConfig(
  guildId: string,
  data: Partial<Omit<GuildConfig, "id" | "guildId" | "createdAt" | "updatedAt">>
): Promise<GuildConfig> {
  // Ensure config exists
  await getOrCreateGuildConfig(guildId);

  return prisma.guildConfig.update({
    where: { guildId },
    data,
  });
}

/**
 * Check if a specific feature is enabled for a guild.
 */
export async function isFeatureEnabled(
  guildId: string,
  feature: keyof Pick<
    GuildConfig,
    | "ticketsEnabled"
    | "moderationEnabled"
    | "roleMenusEnabled"
    | "loggingEnabled"
    | "onboardingEnabled"
    | "integrationsEnabled"
  >
): Promise<boolean> {
  const config = await getOrCreateGuildConfig(guildId);
  return config[feature];
}

/**
 * Get the count of all guilds with configs.
 */
export async function getGuildCount(): Promise<number> {
  return prisma.guildConfig.count();
}
