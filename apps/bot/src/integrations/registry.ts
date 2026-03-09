/**
 * Integration Module Architecture
 *
 * Each integration follows this pattern:
 * 1. Has a provider name (twitch, youtube, twitter, tiktok, google_calendar)
 * 2. Can be enabled/disabled per guild via IntegrationConfig
 * 3. Has isolated failure handling — a failing integration never crashes the bot
 * 4. Uses the notification channel configured per-guild
 *
 * To implement a full integration:
 * 1. Create a new file in this directory (e.g., twitch.ts)
 * 2. Export: initialize(), cleanup(), checkStatus()
 * 3. Register it in the registry below
 * 4. The integration service will handle enable/disable per guild
 */

import { prisma } from "@vezbot/database";
import { createLogger } from "@vezbot/discord";
import type { IntegrationProvider } from "@vezbot/shared";

const log = createLogger({ service: "integrations" });

export interface IntegrationModule {
  provider: IntegrationProvider;
  /** Human-readable name */
  name: string;
  /** Initialize the integration (called when enabled for a guild) */
  initialize: (guildId: string, config: Record<string, unknown>) => Promise<void>;
  /** Clean up resources (called when disabled for a guild) */
  cleanup: (guildId: string) => Promise<void>;
  /** Check if the integration is healthy */
  checkStatus: () => Promise<boolean>;
}

// Registry of available integrations — add new ones here
const registry = new Map<IntegrationProvider, IntegrationModule>();

export function registerIntegration(module: IntegrationModule): void {
  registry.set(module.provider, module);
  log.info({ provider: module.provider }, `Registered integration: ${module.name}`);
}

export function getIntegration(provider: IntegrationProvider): IntegrationModule | undefined {
  return registry.get(provider);
}

export function getAllIntegrations(): IntegrationModule[] {
  return Array.from(registry.values());
}

/**
 * Get integration config for a guild + provider.
 */
export async function getIntegrationConfig(guildId: string, provider: IntegrationProvider) {
  return prisma.integrationConfig.findUnique({
    where: { guildId_provider: { guildId, provider } },
  });
}

/**
 * Enable or disable an integration for a guild.
 */
export async function setIntegrationEnabled(
  guildId: string,
  provider: IntegrationProvider,
  enabled: boolean
): Promise<void> {
  await prisma.integrationConfig.upsert({
    where: { guildId_provider: { guildId, provider } },
    create: { guildId, provider, enabled },
    update: { enabled },
  });

  const module = registry.get(provider);
  if (!module) return;

  try {
    if (enabled) {
      const config = await getIntegrationConfig(guildId, provider);
      const parsed = config?.config ? JSON.parse(config.config) : {};
      await module.initialize(guildId, parsed);
    } else {
      await module.cleanup(guildId);
    }
  } catch (error) {
    log.error({ error, provider, guildId }, "Integration toggle failed");
  }
}
