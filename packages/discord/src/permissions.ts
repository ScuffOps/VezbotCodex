import {
  type GuildMember,
  type Guild,
  type Role,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type PermissionResolvable,
} from "discord.js";
import { errorEmbed } from "./embeds";

type AnyInteraction = ChatInputCommandInteraction | ButtonInteraction;

/**
 * Check if `member` has the given permission.
 * If not, sends an ephemeral error and returns false.
 */
export async function requireUserPermission(
  interaction: AnyInteraction,
  permission: PermissionResolvable,
  label: string
): Promise<boolean> {
  const member = interaction.member as GuildMember | null;
  if (!member) {
    await safeEphemeralReply(interaction, "This command can only be used in a server.");
    return false;
  }

  if (!member.permissions.has(permission)) {
    await safeEphemeralReply(
      interaction,
      `You need the **${label}** permission to use this.`
    );
    return false;
  }

  return true;
}

/**
 * Check if the bot has the given permission in this guild.
 * If not, sends an ephemeral error and returns false.
 */
export async function requireBotPermission(
  interaction: AnyInteraction,
  permission: PermissionResolvable,
  label: string
): Promise<boolean> {
  const guild = interaction.guild;
  if (!guild) {
    await safeEphemeralReply(interaction, "This command can only be used in a server.");
    return false;
  }

  const botMember = guild.members.me;
  if (!botMember) {
    await safeEphemeralReply(interaction, "I could not resolve my own permissions in this server.");
    return false;
  }

  if (!botMember.permissions.has(permission)) {
    await safeEphemeralReply(
      interaction,
      `I need the **${label}** permission to perform this action. Please update my role.`
    );
    return false;
  }

  return true;
}

/**
 * Check if the bot can manage a given role (role hierarchy check).
 * Returns false and replies with error if the role is above the bot's highest role.
 */
export async function canManageRole(
  interaction: AnyInteraction,
  role: Role
): Promise<boolean> {
  const guild = interaction.guild;
  if (!guild) return false;

  const botMember = guild.members.me;
  if (!botMember) return false;

  if (role.position >= botMember.roles.highest.position) {
    await safeEphemeralReply(
      interaction,
      `I cannot manage the **${role.name}** role — it is at or above my highest role in the hierarchy.`
    );
    return false;
  }

  if (role.managed) {
    await safeEphemeralReply(
      interaction,
      `The **${role.name}** role is managed by an integration and cannot be assigned manually.`
    );
    return false;
  }

  return true;
}

/**
 * Check if the acting user can moderate a target member.
 * Prevents moderating users with equal/higher roles.
 */
export async function canModerate(
  interaction: AnyInteraction,
  target: GuildMember
): Promise<boolean> {
  const actor = interaction.member as GuildMember;
  if (!actor) return false;

  // Cannot moderate yourself
  if (actor.id === target.id) {
    await safeEphemeralReply(interaction, "You cannot moderate yourself.");
    return false;
  }

  // Cannot moderate the guild owner
  if (target.id === interaction.guild?.ownerId) {
    await safeEphemeralReply(interaction, "You cannot moderate the server owner.");
    return false;
  }

  // Cannot moderate someone with equal/higher role
  if (target.roles.highest.position >= actor.roles.highest.position) {
    await safeEphemeralReply(
      interaction,
      "You cannot moderate a member with an equal or higher role than yours."
    );
    return false;
  }

  // Check bot can also act on this member
  const botMember = interaction.guild?.members.me;
  if (botMember && target.roles.highest.position >= botMember.roles.highest.position) {
    await safeEphemeralReply(
      interaction,
      `I cannot moderate **${target.displayName}** — their highest role is at or above mine.`
    );
    return false;
  }

  return true;
}

/**
 * Safe ephemeral reply — handles already-replied interactions gracefully.
 */
export async function safeEphemeralReply(
  interaction: AnyInteraction,
  content: string
): Promise<void> {
  try {
    const embed = errorEmbed("Permission Denied", content);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch {
    // Interaction may have expired — nothing we can do
  }
}

/**
 * Safe reply utility — wraps reply/followUp with error handling.
 * Prevents crashes from expired interactions, missing channels, etc.
 */
export async function safeReply(
  interaction: AnyInteraction,
  options: Parameters<AnyInteraction["reply"]>[0]
): Promise<void> {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options);
    } else {
      await interaction.reply(options);
    }
  } catch {
    // Interaction expired or channel deleted — log but don't crash
  }
}
