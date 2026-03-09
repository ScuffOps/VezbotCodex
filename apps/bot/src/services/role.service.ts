import {
  type Guild,
  type GuildMember,
  type Role,
  type TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@vezbot/database";
import { createLogger, createEmbed, successEmbed } from "@vezbot/discord";
import { Colors } from "@vezbot/shared";

const log = createLogger({ service: "roles" });

/**
 * Create a role menu record and send the interactive message.
 */
export async function createRoleMenu(
  guild: Guild,
  channel: TextChannel,
  title: string,
  description: string,
  roles: Array<{ roleId: string; label: string; emoji?: string; description?: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate all roles exist and are manageable
    for (const roleData of roles) {
      const role = guild.roles.cache.get(roleData.roleId);
      if (!role) {
        return { success: false, error: `Role ${roleData.label} (${roleData.roleId}) not found.` };
      }

      const botMember = guild.members.me;
      if (botMember && role.position >= botMember.roles.highest.position) {
        return {
          success: false,
          error: `Cannot manage role **${role.name}** — it is at or above my highest role.`,
        };
      }

      if (role.managed) {
        return {
          success: false,
          error: `Role **${role.name}** is managed by an integration and cannot be self-assigned.`,
        };
      }
    }

    // Build the embed
    const embed = createEmbed("info", {
      title,
      description: [
        description,
        "",
        "Click a button below to toggle a role.",
        "",
        ...roles.map((r) => {
          const emoji = r.emoji ? `${r.emoji} ` : "";
          const desc = r.description ? ` — ${r.description}` : "";
          return `${emoji}**${r.label}**${desc}`;
        }),
      ].join("\n"),
    });

    // Build button rows (max 5 buttons per row, max 5 rows)
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < roles.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const chunk = roles.slice(i, i + 5);

      for (const roleData of chunk) {
        const button = new ButtonBuilder()
          .setCustomId(`role-toggle:${roleData.roleId}`)
          .setLabel(roleData.label)
          .setStyle(ButtonStyle.Secondary);

        if (roleData.emoji) button.setEmoji(roleData.emoji);
        row.addComponents(button);
      }

      rows.push(row);
    }

    // Send the message
    const message = await channel.send({ embeds: [embed], components: rows });

    // Save to database
    const roleMenu = await prisma.roleMenu.create({
      data: {
        guildId: guild.id,
        title,
        description,
        channelId: channel.id,
        messageId: message.id,
        options: {
          create: roles.map((r, i) => ({
            roleId: r.roleId,
            label: r.label,
            emoji: r.emoji,
            description: r.description,
            position: i,
          })),
        },
      },
    });

    log.info({ guildId: guild.id, menuId: roleMenu.id, roleCount: roles.length }, "Role menu created");
    return { success: true };
  } catch (error) {
    log.error({ error, guildId: guild.id }, "Failed to create role menu");
    return { success: false, error: "Failed to create role menu. Check bot permissions." };
  }
}

/**
 * Toggle a role for a member from a role menu button press.
 * Returns the action taken for feedback.
 */
export async function toggleRole(
  guild: Guild,
  member: GuildMember,
  roleId: string
): Promise<{ success: boolean; action?: "added" | "removed"; roleName?: string; error?: string }> {
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    return { success: false, error: "This role no longer exists." };
  }

  // Safety checks
  const botMember = guild.members.me;
  if (botMember && role.position >= botMember.roles.highest.position) {
    return { success: false, error: `Cannot manage role **${role.name}** — it's above my role.` };
  }

  if (role.managed) {
    return { success: false, error: `**${role.name}** is managed by an integration.` };
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role, "Self-role menu");
      return { success: true, action: "removed", roleName: role.name };
    } else {
      await member.roles.add(role, "Self-role menu");
      return { success: true, action: "added", roleName: role.name };
    }
  } catch (error) {
    log.error({ error, guildId: guild.id, roleId, member: member.id }, "Failed to toggle role");
    return { success: false, error: "Failed to update your role. Please contact a moderator." };
  }
}
