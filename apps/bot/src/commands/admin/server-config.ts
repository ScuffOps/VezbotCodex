import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createEmbed, successEmbed, requireUserPermission, safeReply } from "@vezbot/discord";
import { getOrCreateGuildConfig, updateGuildConfig } from "../../services/guild-config.service";

export const data = new SlashCommandBuilder()
  .setName("server-config")
  .setDescription("View or edit server configuration")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("View current server configuration")
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-log-channel")
      .setDescription("Set the general log channel")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("Channel for general logs")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-mod-log")
      .setDescription("Set the moderation log channel")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("Channel for moderation logs")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-mod-role")
      .setDescription("Set the moderator role")
      .addRoleOption((opt) =>
        opt.setName("role").setDescription("Moderator role").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("toggle")
      .setDescription("Toggle a feature on or off")
      .addStringOption((opt) =>
        opt
          .setName("feature")
          .setDescription("Feature to toggle")
          .setRequired(true)
          .addChoices(
            { name: "Tickets", value: "ticketsEnabled" },
            { name: "Moderation", value: "moderationEnabled" },
            { name: "Role Menus", value: "roleMenusEnabled" },
            { name: "Logging", value: "loggingEnabled" },
            { name: "Onboarding", value: "onboardingEnabled" },
            { name: "Integrations", value: "integrationsEnabled" }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ManageGuild,
    "Manage Server"
  );
  if (!hasPerms) return;

  const sub = interaction.options.getSubcommand();
  const config = await getOrCreateGuildConfig(interaction.guildId);

  switch (sub) {
    case "view": {
      const toggle = (v: boolean) => (v ? "✅ Enabled" : "❌ Disabled");
      const channel = (id: string | null) => (id ? `<#${id}>` : "Not set");
      const role = (id: string | null) => (id ? `<@&${id}>` : "Not set");

      const embed = createEmbed("info", {
        title: "Server Configuration",
        fields: [
          {
            name: "Feature Toggles",
            value: [
              `Tickets: ${toggle(config.ticketsEnabled)}`,
              `Moderation: ${toggle(config.moderationEnabled)}`,
              `Role Menus: ${toggle(config.roleMenusEnabled)}`,
              `Logging: ${toggle(config.loggingEnabled)}`,
              `Onboarding: ${toggle(config.onboardingEnabled)}`,
              `Integrations: ${toggle(config.integrationsEnabled)}`,
            ].join("\n"),
          },
          {
            name: "Channels",
            value: [
              `General Log: ${channel(config.logChannelId)}`,
              `Mod Log: ${channel(config.modLogChannelId)}`,
              `Ticket Log: ${channel(config.ticketLogChannelId)}`,
              `Ticket Category: ${channel(config.ticketCategoryId)}`,
              `Welcome: ${channel(config.welcomeChannelId)}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "Roles",
            value: [
              `Mod: ${role(config.modRoleId)}`,
              `Admin: ${role(config.adminRoleId)}`,
            ].join("\n"),
            inline: true,
          },
        ],
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }

    case "set-log-channel": {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(interaction.guildId, {
        logChannelId: channel.id,
        loggingEnabled: true,
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Log Channel Updated", `General logs will be sent to <#${channel.id}>`)],
        ephemeral: true,
      });
      break;
    }

    case "set-mod-log": {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildConfig(interaction.guildId, {
        modLogChannelId: channel.id,
        loggingEnabled: true,
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Mod Log Updated", `Moderation logs will be sent to <#${channel.id}>`)],
        ephemeral: true,
      });
      break;
    }

    case "set-mod-role": {
      const role = interaction.options.getRole("role", true);
      await updateGuildConfig(interaction.guildId, { modRoleId: role.id });
      await safeReply(interaction, {
        embeds: [successEmbed("Mod Role Updated", `Moderator role set to <@&${role.id}>`)],
        ephemeral: true,
      });
      break;
    }

    case "toggle": {
      const feature = interaction.options.getString("feature", true) as keyof typeof config;
      const current = config[feature] as boolean;
      await updateGuildConfig(interaction.guildId, { [feature]: !current });
      const state = !current ? "enabled" : "disabled";
      const featureName = String(feature).replace("Enabled", "");
      await safeReply(interaction, {
        embeds: [
          successEmbed(
            "Feature Toggled",
            `**${featureName}** has been **${state}**.`
          ),
        ],
        ephemeral: true,
      });
      break;
    }
  }
}
