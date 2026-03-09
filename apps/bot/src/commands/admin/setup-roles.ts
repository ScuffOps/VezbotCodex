import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { successEmbed, errorEmbed, requireUserPermission, requireBotPermission, safeReply } from "@vezbot/discord";
import { createRoleMenu } from "../../services/role.service";

export const data = new SlashCommandBuilder()
  .setName("setup-roles")
  .setDescription("Create a self-role menu")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addStringOption((opt) =>
    opt.setName("title").setDescription("Title for the role menu").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("description").setDescription("Description for the role menu").setRequired(true)
  )
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to send the role menu in")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addRoleOption((opt) =>
    opt.setName("role1").setDescription("First role").setRequired(true)
  )
  .addRoleOption((opt) =>
    opt.setName("role2").setDescription("Second role").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role3").setDescription("Third role").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role4").setDescription("Fourth role").setRequired(false)
  )
  .addRoleOption((opt) =>
    opt.setName("role5").setDescription("Fifth role").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) return;

  const hasPerms = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ManageRoles,
    "Manage Roles"
  );
  if (!hasPerms) return;

  const hasBotPerms = await requireBotPermission(
    interaction,
    PermissionFlagsBits.ManageRoles,
    "Manage Roles"
  );
  if (!hasBotPerms) return;

  const title = interaction.options.getString("title", true);
  const description = interaction.options.getString("description", true);
  const channel = interaction.options.getChannel("channel", true) as TextChannel;

  // Collect all provided roles
  const roles: Array<{ roleId: string; label: string }> = [];
  for (let i = 1; i <= 5; i++) {
    const role = interaction.options.getRole(`role${i}`);
    if (role) {
      roles.push({ roleId: role.id, label: role.name });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const result = await createRoleMenu(
    interaction.guild,
    channel,
    title,
    description,
    roles
  );

  if (result.success) {
    await interaction.editReply({
      embeds: [
        successEmbed(
          "Role Menu Created",
          `Role menu with ${roles.length} role(s) has been posted in <#${channel.id}>.`
        ),
      ],
    });
  } else {
    await interaction.editReply({
      embeds: [errorEmbed("Role Menu Failed", result.error ?? "Could not create role menu.")],
    });
  }
}
