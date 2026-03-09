import type { GuildMember, Guild } from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger, modEmbed } from "@vezbot/discord";
import { CaseType } from "@vezbot/shared";
import { getOrCreateGuildConfig } from "./guild-config.service";
import { sendLogEmbed } from "./logging.service";

const log = createLogger({ service: "moderation" });

interface ModerationAction {
  guildId: string;
  targetId: string;
  moderatorId: string;
  type: string;
  reason?: string;
  duration?: number; // seconds
}

/**
 * Create a moderation case and log it.
 */
async function createCase(action: ModerationAction): Promise<number> {
  // Get next case number
  const lastCase = await prisma.moderationCase.findFirst({
    where: { guildId: action.guildId },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });

  const caseNumber = (lastCase?.caseNumber ?? 0) + 1;

  await prisma.moderationCase.create({
    data: {
      guildId: action.guildId,
      caseNumber,
      targetId: action.targetId,
      moderatorId: action.moderatorId,
      type: action.type,
      reason: action.reason,
      duration: action.duration,
      expiresAt: action.duration
        ? new Date(Date.now() + action.duration * 1000)
        : undefined,
    },
  });

  return caseNumber;
}

/**
 * Warn a member — creates a case, does NOT apply any Discord action.
 */
export async function warnMember(
  guild: Guild,
  target: GuildMember,
  moderator: GuildMember,
  reason: string
): Promise<{ success: boolean; caseNumber?: number; error?: string }> {
  try {
    const caseNumber = await createCase({
      guildId: guild.id,
      targetId: target.id,
      moderatorId: moderator.id,
      type: CaseType.Warning,
      reason,
    });

    // Try to DM the user
    try {
      await target.send({
        embeds: [
          modEmbed(
            "Warning Received",
            [
              `You have been warned in **${guild.name}**.`,
              `**Reason:** ${reason}`,
              `**Case:** #${caseNumber}`,
            ].join("\n")
          ),
        ],
      });
    } catch {
      // User has DMs disabled — not a failure
    }

    // Log to mod channel
    await sendLogEmbed(guild.id, "moderation", modEmbed(
      `Warning — Case #${caseNumber}`,
      [
        `**Target:** ${target} (${target.id})`,
        `**Moderator:** ${moderator}`,
        `**Reason:** ${reason}`,
      ].join("\n")
    ));

    log.info(
      { guildId: guild.id, target: target.id, moderator: moderator.id, caseNumber },
      "Member warned"
    );

    return { success: true, caseNumber };
  } catch (error) {
    log.error({ error, guildId: guild.id }, "Failed to warn member");
    return { success: false, error: "Failed to create warning." };
  }
}

/**
 * Timeout a member — applies Discord timeout AND creates a case.
 */
export async function timeoutMember(
  guild: Guild,
  target: GuildMember,
  moderator: GuildMember,
  durationSeconds: number,
  reason: string
): Promise<{ success: boolean; caseNumber?: number; error?: string }> {
  try {
    // Apply the timeout via Discord API
    await target.timeout(durationSeconds * 1000, reason);

    const caseNumber = await createCase({
      guildId: guild.id,
      targetId: target.id,
      moderatorId: moderator.id,
      type: CaseType.Timeout,
      reason,
      duration: durationSeconds,
    });

    // Format duration for display
    const durationStr = formatDuration(durationSeconds);

    // Try to DM the user
    try {
      await target.send({
        embeds: [
          modEmbed(
            "Timeout Applied",
            [
              `You have been timed out in **${guild.name}**.`,
              `**Duration:** ${durationStr}`,
              `**Reason:** ${reason}`,
              `**Case:** #${caseNumber}`,
            ].join("\n")
          ),
        ],
      });
    } catch {
      // User has DMs disabled
    }

    // Log to mod channel
    await sendLogEmbed(guild.id, "moderation", modEmbed(
      `Timeout — Case #${caseNumber}`,
      [
        `**Target:** ${target} (${target.id})`,
        `**Moderator:** ${moderator}`,
        `**Duration:** ${durationStr}`,
        `**Reason:** ${reason}`,
      ].join("\n")
    ));

    log.info(
      { guildId: guild.id, target: target.id, moderator: moderator.id, caseNumber, durationSeconds },
      "Member timed out"
    );

    return { success: true, caseNumber };
  } catch (error) {
    log.error({ error, guildId: guild.id }, "Failed to timeout member");
    return { success: false, error: "Failed to timeout member. Check bot permissions and role hierarchy." };
  }
}

/**
 * Get moderation history for a user in a guild.
 */
export async function getCaseHistory(
  guildId: string,
  targetId: string
): Promise<Array<{
  caseNumber: number;
  type: string;
  reason: string | null;
  moderatorId: string;
  createdAt: Date;
}>> {
  return prisma.moderationCase.findMany({
    where: { guildId, targetId },
    orderBy: { caseNumber: "desc" },
    take: 25,
    select: {
      caseNumber: true,
      type: true,
      reason: true,
      moderatorId: true,
      createdAt: true,
    },
  });
}

/**
 * Get a specific case by number.
 */
export async function getCase(guildId: string, caseNumber: number) {
  return prisma.moderationCase.findUnique({
    where: { guildId_caseNumber: { guildId, caseNumber } },
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
