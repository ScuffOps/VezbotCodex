import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type NewsChannel,
  type TextChannel,
  type User,
} from "discord.js";
import { prisma, type EmbedTemplate } from "@vezbot/database";
import { applyGuildBranding } from "../../services/branding.service";
import {
  createEmbed,
  errorEmbed,
  infoEmbed,
  requireUserPermission,
  safeReply,
  successEmbed,
} from "@vezbot/discord";

const CLEAR_VALUE_REGEX = /^(clear|none|null|remove|reset)$/i;
const MAX_TEMPLATES_PER_GUILD = 100;

export const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Create, edit, preview, and send saved embed templates")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List saved embed templates for this server")
  )
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Create a new embed template")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Template name (e.g. rules_embed)")
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(60)
      )
      .addStringOption((opt) =>
        opt
          .setName("title")
          .setDescription("Embed title (defaults to template name)")
          .setRequired(false)
          .setMaxLength(256)
      )
      .addStringOption((opt) =>
        opt
          .setName("description")
          .setDescription("Embed description")
          .setRequired(false)
          .setMaxLength(4000)
      )
      .addStringOption((opt) =>
        opt
          .setName("color")
          .setDescription("Hex color (e.g. #C0EEFF)")
          .setRequired(false)
          .setMaxLength(7)
      )
      .addStringOption((opt) =>
        opt
          .setName("footer")
          .setDescription("Footer text")
          .setRequired(false)
          .setMaxLength(2048)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("show")
      .setDescription("Preview an embed template")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Template name")
          .setRequired(true)
      )
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("User context for variables like {user_name}")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("send")
      .setDescription("Send an embed template to a channel")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Template name")
          .setRequired(true)
      )
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("Target channel (defaults to saved channel or current channel)")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName("content")
          .setDescription("Optional message content above the embed")
          .setRequired(false)
          .setMaxLength(2000)
      )
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("User context for variables")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("Delete an embed template")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Template name")
          .setRequired(true)
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName("edit")
      .setDescription("Edit an existing embed template")
      .addSubcommand((sub) =>
        sub
          .setName("title")
          .setDescription("Set embed title (use clear to reset to template name)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("title")
              .setDescription("New title (or clear)")
              .setRequired(true)
              .setMaxLength(256)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("description")
          .setDescription("Set embed description (use clear to remove)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("description")
              .setDescription("New description (or clear)")
              .setRequired(true)
              .setMaxLength(4000)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("color")
          .setDescription("Set embed color (hex or clear)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("color")
              .setDescription("Hex color like #C0EEFF or clear")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("footer")
          .setDescription("Set footer text (use clear to remove)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("text")
              .setDescription("Footer text (or clear)")
              .setRequired(true)
              .setMaxLength(2048)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("image")
          .setDescription("Set image URL (use clear to remove)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("url")
              .setDescription("Image URL or variable token (or clear)")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("thumbnail")
          .setDescription("Set thumbnail URL (use clear to remove)")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addStringOption((opt) =>
            opt
              .setName("url")
              .setDescription("Thumbnail URL or variable token (or clear)")
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("channel")
          .setDescription("Set or clear the default send channel")
          .addStringOption((opt) =>
            opt
              .setName("name")
              .setDescription("Template name")
              .setRequired(true)
          )
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .setDescription("Default target channel")
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
              .setRequired(false)
          )
          .addBooleanOption((opt) =>
            opt
              .setName("clear")
              .setDescription("Set true to remove the default channel")
              .setRequired(false)
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Server Only", "This command can only be used inside a server.")],
      ephemeral: true,
    });
    return;
  }

  const allowed = await requireUserPermission(
    interaction,
    PermissionFlagsBits.ManageGuild,
    "Manage Server"
  );
  if (!allowed) return;

  const subGroup = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand(true);

  try {
    if (!subGroup && sub === "list") {
      await handleList(interaction);
      return;
    }

    if (!subGroup && sub === "create") {
      await handleCreate(interaction);
      return;
    }

    if (!subGroup && sub === "show") {
      await handleShow(interaction);
      return;
    }

    if (!subGroup && sub === "send") {
      await handleSend(interaction);
      return;
    }

    if (!subGroup && sub === "delete") {
      await handleDelete(interaction);
      return;
    }

    if (subGroup === "edit") {
      await handleEdit(interaction, sub);
      return;
    }

    await safeReply(interaction, {
      embeds: [errorEmbed("Unsupported Subcommand", "This embed action is not implemented.")],
      ephemeral: true,
    });
  } catch (error) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Embed Command Failed", toErrorMessage(error))],
      ephemeral: true,
    });
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const templates = await prisma.embedTemplate.findMany({
    where: { guildId: interaction.guildId! },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 25,
  });

  if (templates.length === 0) {
    await safeReply(interaction, {
      embeds: [infoEmbed("No Saved Embeds", "Create one with `/embed create name:<name>`.")],
      ephemeral: true,
    });
    return;
  }

  const lines = templates.map((template) => {
    const updated = formatTimestamp(template.updatedAt);
    return `• **${template.name}** - updated ${updated}`;
  });

  await safeReply(interaction, {
    embeds: [
      createEmbed("info", {
        title: `Saved Embeds (${templates.length})`,
        description: lines.join("\n"),
      }),
    ],
    ephemeral: true,
  });
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const rawName = interaction.options.getString("name", true);
  const rawTitle = interaction.options.getString("title", false);
  const rawDescription = interaction.options.getString("description", false);
  const rawColor = interaction.options.getString("color", false);
  const rawFooter = interaction.options.getString("footer", false);

  const name = normalizeTemplateName(rawName);
  const existing = await findTemplateByName(guildId, name);
  if (existing) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Template Exists", `An embed named **${existing.name}** already exists.`)],
      ephemeral: true,
    });
    return;
  }

  const count = await prisma.embedTemplate.count({ where: { guildId } });
  if (count >= MAX_TEMPLATES_PER_GUILD) {
    await safeReply(interaction, {
      embeds: [
        errorEmbed(
          "Template Limit Reached",
          `This server already has ${MAX_TEMPLATES_PER_GUILD} embed templates. Delete one before creating another.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  const title = rawTitle ? normalizeRequiredText(rawTitle, 256, "title") : name;
  const description = rawDescription ? normalizeOptionalText(rawDescription, 4000, "description") : null;
  const colorHex = rawColor ? normalizeHexColor(rawColor) : null;
  const footerText = rawFooter ? normalizeOptionalText(rawFooter, 2048, "footer") : null;

  await prisma.embedTemplate.create({
    data: {
      guildId,
      name,
      title,
      description,
      colorHex,
      footerText,
    },
  });

  await safeReply(interaction, {
    embeds: [
      successEmbed(
        "Embed Created",
        [
          `Saved as **${name}**.`,
          "Use `/embed edit ...` to customize fields.",
          "Use `/embed show` to preview or `/embed send` to post.",
        ].join("\n")
      ),
    ],
    ephemeral: true,
  });
}

async function handleShow(interaction: ChatInputCommandInteraction) {
  const name = normalizeTemplateName(interaction.options.getString("name", true));
  const template = await findTemplateByName(interaction.guildId!, name);
  if (!template) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Template Not Found", `No embed named **${name}** was found.`)],
      ephemeral: true,
    });
    return;
  }

  const user = interaction.options.getUser("user", false) ?? interaction.user;
  const components = getTemplateComponents(template, interaction, user);
  if (template.componentsV2Enabled) {
    if (!components || components.length === 0) {
      await safeReply(interaction, {
        embeds: [errorEmbed("V2 Components Missing", "This template is in Component V2 mode but has no valid components JSON.")],
        ephemeral: true,
      });
      return;
    }

    await safeReply(interaction, {
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components,
    });
    return;
  }

  const embed = buildTemplateEmbed(template, interaction, user);
  const content = template.content
    ? renderTemplateTokens(template.content, interaction, user).slice(0, 2000)
    : undefined;

  if (!hasRenderableEmbedContent(embed) && !content) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Nothing to Preview", "This template has no visible embed content yet.")],
      ephemeral: true,
    });
    return;
  }

  await applyGuildBranding(interaction.guildId!, embed, template);
  await safeReply(interaction, {
    content,
    embeds: hasRenderableEmbedContent(embed) ? [embed] : [],
    ephemeral: true,
  });
}

async function handleSend(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  const name = normalizeTemplateName(interaction.options.getString("name", true));
  const template = await findTemplateByName(interaction.guildId!, name);
  if (!template) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Template Not Found", `No embed named **${name}** was found.`)],
      ephemeral: true,
    });
    return;
  }

  const requestedChannel = interaction.options.getChannel("channel", false);
  const targetChannel = await resolveSendChannel(interaction, template, requestedChannel);
  if (!targetChannel) {
    await safeReply(interaction, {
      embeds: [
        errorEmbed(
          "No Target Channel",
          "Set a default channel with `/embed edit channel`, pass `channel:`, or run this inside a text channel."
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  const botMember = interaction.guild.members.me ?? (await interaction.guild.members.fetchMe().catch(() => null));
  if (!botMember) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Missing Bot Member", "Could not resolve bot permissions for this server.")],
      ephemeral: true,
    });
    return;
  }

  const perms = targetChannel.permissionsFor(botMember);
  const requiredPerms = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];
  if (!template.componentsV2Enabled) {
    requiredPerms.push(PermissionFlagsBits.EmbedLinks);
  }

  if (!perms?.has(requiredPerms)) {
    await safeReply(interaction, {
      embeds: [
        errorEmbed(
          "Missing Permissions",
          template.componentsV2Enabled
            ? `I need **View Channel** and **Send Messages** in <#${targetChannel.id}>.`
            : `I need **View Channel**, **Send Messages**, and **Embed Links** in <#${targetChannel.id}>.`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  const user = interaction.options.getUser("user", false) ?? interaction.user;
  const components = getTemplateComponents(template, interaction, user);
  if (template.componentsV2Enabled) {
    if (!components || components.length === 0) {
      await safeReply(interaction, {
        embeds: [errorEmbed("V2 Components Missing", "This template is in Component V2 mode but has no valid components JSON.")],
        ephemeral: true,
      });
      return;
    }

    const message = await targetChannel.send({
      flags: MessageFlags.IsComponentsV2,
      components,
      allowedMentions: { parse: [] },
    });

    await safeReply(interaction, {
      embeds: [
        successEmbed(
          "Embed Sent",
          `Posted **${template.name}** (Component V2) to <#${targetChannel.id}>.\n[Jump to message](${message.url})`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  const embed = buildTemplateEmbed(template, interaction, user);
  const rawContent = interaction.options.getString("content", false);
  const templateContent = template.content
    ? renderTemplateTokens(template.content, interaction, user).slice(0, 2000)
    : undefined;
  const renderedContent = rawContent
    ? renderTemplateTokens(rawContent, interaction, user).slice(0, 2000)
    : templateContent;

  if (!hasRenderableEmbedContent(embed) && !renderedContent) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Nothing to Send", "This template has no visible content to send.")],
      ephemeral: true,
    });
    return;
  }

  await applyGuildBranding(interaction.guildId!, embed, template);
  const message = await targetChannel.send({
    content: renderedContent,
    embeds: hasRenderableEmbedContent(embed) ? [embed] : [],
    allowedMentions: { parse: [] },
  });

  await safeReply(interaction, {
    embeds: [
      successEmbed(
        "Embed Sent",
        `Posted **${template.name}** to <#${targetChannel.id}>.\n[Jump to message](${message.url})`
      ),
    ],
    ephemeral: true,
  });
}

async function handleDelete(interaction: ChatInputCommandInteraction) {
  const name = normalizeTemplateName(interaction.options.getString("name", true));
  const template = await findTemplateByName(interaction.guildId!, name);
  if (!template) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Template Not Found", `No embed named **${name}** was found.`)],
      ephemeral: true,
    });
    return;
  }

  await prisma.embedTemplate.delete({ where: { id: template.id } });

  await safeReply(interaction, {
    embeds: [successEmbed("Embed Deleted", `Removed **${template.name}**.`)],
    ephemeral: true,
  });
}

async function handleEdit(interaction: ChatInputCommandInteraction, sub: string) {
  const name = normalizeTemplateName(interaction.options.getString("name", true));
  const template = await findTemplateByName(interaction.guildId!, name);
  if (!template) {
    await safeReply(interaction, {
      embeds: [errorEmbed("Template Not Found", `No embed named **${name}** was found.`)],
      ephemeral: true,
    });
    return;
  }

  switch (sub) {
    case "title": {
      const raw = interaction.options.getString("title", true);
      const title = isClearValue(raw) ? template.name : normalizeRequiredText(raw, 256, "title");
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { title },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated title for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "description": {
      const raw = interaction.options.getString("description", true);
      const description = normalizeOptionalText(raw, 4000, "description");
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { description },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated description for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "color": {
      const raw = interaction.options.getString("color", true);
      const colorHex = normalizeHexColor(raw);
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { colorHex },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated color for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "footer": {
      const raw = interaction.options.getString("text", true);
      const footerText = normalizeOptionalText(raw, 2048, "footer");
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { footerText },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated footer for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "image": {
      const raw = interaction.options.getString("url", true);
      const imageUrl = normalizeTemplateUrl(raw, "image");
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { imageUrl },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated image for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "thumbnail": {
      const raw = interaction.options.getString("url", true);
      const thumbnailUrl = normalizeTemplateUrl(raw, "thumbnail");
      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: { thumbnailUrl },
      });
      await safeReply(interaction, {
        embeds: [successEmbed("Embed Updated", `Updated thumbnail for **${template.name}**.`)],
        ephemeral: true,
      });
      return;
    }

    case "channel": {
      const channel = interaction.options.getChannel("channel", false);
      const clear = interaction.options.getBoolean("clear", false) ?? false;

      if (!clear && !channel) {
        await safeReply(interaction, {
          embeds: [errorEmbed("Channel Required", "Provide `channel:` or use `clear:true`.")],
          ephemeral: true,
        });
        return;
      }

      if (channel && !isGuildTextOrAnnouncement(channel)) {
        await safeReply(interaction, {
          embeds: [errorEmbed("Invalid Channel", "Only text and announcement channels are supported.")],
          ephemeral: true,
        });
        return;
      }

      await prisma.embedTemplate.update({
        where: { id: template.id },
        data: {
          channelId: clear ? null : channel?.id ?? null,
        },
      });

      await safeReply(interaction, {
        embeds: [
          successEmbed(
            "Embed Updated",
            clear
              ? `Cleared default channel for **${template.name}**.`
              : `Default channel for **${template.name}** is now <#${channel!.id}>.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    default:
      await safeReply(interaction, {
        embeds: [errorEmbed("Unsupported Edit Action", `Edit mode **${sub}** is not supported.`)],
        ephemeral: true,
      });
  }
}

async function findTemplateByName(guildId: string, name: string): Promise<EmbedTemplate | null> {
  return prisma.embedTemplate.findFirst({
    where: {
      guildId,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

function normalizeTemplateName(raw: string): string {
  const value = raw.trim();
  if (value.length < 2 || value.length > 60) {
    throw new Error("Template name must be between 2 and 60 characters.");
  }
  return value;
}

function normalizeRequiredText(raw: string, maxLength: number, field: string): string {
  const value = raw.trim();
  if (!value) {
    throw new Error(`${field} cannot be empty.`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} is too long (max ${maxLength} characters).`);
  }
  return value;
}

function normalizeOptionalText(raw: string, maxLength: number, field: string): string | null {
  if (isClearValue(raw)) return null;
  return normalizeRequiredText(raw, maxLength, field);
}

function normalizeHexColor(raw: string): string | null {
  if (isClearValue(raw)) return null;

  const value = raw.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
    throw new Error("Color must be a valid 6-digit hex code (example: #C0EEFF).");
  }

  return `#${value.toUpperCase()}`;
}

function normalizeTemplateUrl(raw: string, field: string): string | null {
  if (isClearValue(raw)) return null;

  const value = raw.trim();
  if (!value) return null;

  if (value.includes("{")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`${field} URL must use http or https.`);
    }
    return parsed.toString();
  } catch {
    throw new Error(`${field} must be a valid URL.`);
  }
}

function isClearValue(raw: string): boolean {
  return CLEAR_VALUE_REGEX.test(raw.trim());
}

function renderTemplateTokens(
  raw: string,
  interaction: ChatInputCommandInteraction,
  user: User
): string {
  const guild = interaction.guild;
  if (!guild) return raw;

  const serverIcon = guild.iconURL({ extension: "png", size: 512 }) ?? "";
  const userAvatar = user.displayAvatarURL({ extension: "png", size: 512 });
  const userTag = user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`;

  const replacements: Array<[string, string]> = [
    ["{newline}", "\n"],
    ["{server_name}", guild.name],
    ["{server_membercount}", String(guild.memberCount)],
    ["{server_icon}", serverIcon],
    ["{user_name}", user.username],
    ["{user_tag}", userTag],
    ["{user_id}", user.id],
    ["{user_mention}", `<@${user.id}>`],
    ["{user_avatar}", userAvatar],
  ];

  let rendered = raw;
  for (const [token, value] of replacements) {
    rendered = rendered.split(token).join(value);
  }
  return rendered;
}

function buildTemplateEmbed(
  template: EmbedTemplate,
  interaction: ChatInputCommandInteraction,
  user: User
): EmbedBuilder {
  const embed = new EmbedBuilder();

  const title = renderTemplateTokens(template.title, interaction, user).slice(0, 256);
  if (title) embed.setTitle(title);

  const description = template.description
    ? renderTemplateTokens(template.description, interaction, user).slice(0, 4000)
    : null;
  if (description) embed.setDescription(description);

  if (template.colorHex && /^#[0-9A-F]{6}$/i.test(template.colorHex)) {
    embed.setColor(template.colorHex as `#${string}`);
  }

  const footerText = template.footerText
    ? renderTemplateTokens(template.footerText, interaction, user).slice(0, 2048)
    : null;
  if (footerText) {
    embed.setFooter({ text: footerText });
  }

  const imageUrl = template.imageUrl
    ? parseHttpUrl(renderTemplateTokens(template.imageUrl, interaction, user))
    : null;
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  const thumbnailUrl = template.thumbnailUrl
    ? parseHttpUrl(renderTemplateTokens(template.thumbnailUrl, interaction, user))
    : null;
  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }

  return embed;
}

function hasRenderableEmbedContent(embed: EmbedBuilder): boolean {
  const data = embed.toJSON();
  return Boolean(
    data.title ||
      data.description ||
      data.author?.name ||
      data.footer?.text ||
      data.image?.url ||
      data.thumbnail?.url ||
      (data.fields && data.fields.length > 0)
  );
}

function parseHttpUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function renderJsonTokens(
  value: unknown,
  interaction: ChatInputCommandInteraction,
  user: User
): unknown {
  if (typeof value === "string") {
    return renderTemplateTokens(value, interaction, user);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderJsonTokens(item, interaction, user));
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = renderJsonTokens(nested, interaction, user);
    }
    return output;
  }

  return value;
}

function getTemplateComponents(
  template: EmbedTemplate,
  interaction: ChatInputCommandInteraction,
  user: User
) {
  if (!template.componentsJson) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(template.componentsJson);
  } catch {
    throw new Error(`Template "${template.name}" has invalid components JSON.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Template "${template.name}" components JSON must be an array.`);
  }

  if (parsed.length > 40) {
    throw new Error(`Template "${template.name}" exceeds the 40-component limit.`);
  }

  const rendered = renderJsonTokens(parsed, interaction, user);
  if (!Array.isArray(rendered)) {
    throw new Error(`Template "${template.name}" components rendered to an invalid shape.`);
  }

  return rendered;
}

async function resolveSendChannel(
  interaction: ChatInputCommandInteraction,
  template: EmbedTemplate,
  requested: unknown
): Promise<TextChannel | NewsChannel | null> {
  if (!interaction.guild) return null;

  if (isGuildTextOrAnnouncement(requested)) {
    return requested;
  }

  if (template.channelId) {
    const saved = await interaction.guild.channels.fetch(template.channelId).catch(() => null);
    if (saved && isGuildTextOrAnnouncement(saved)) {
      return saved;
    }
  }

  const current = interaction.channel;
  if (isGuildTextOrAnnouncement(current)) {
    return current;
  }

  return null;
}

function isGuildTextOrAnnouncement(channel: unknown): channel is TextChannel | NewsChannel {
  if (!channel || typeof channel !== "object") return false;
  if (!("type" in channel)) return false;

  const candidate = channel as {
    type?: ChannelType;
    send?: unknown;
    permissionsFor?: unknown;
  };

  const validType =
    candidate.type === ChannelType.GuildText ||
    candidate.type === ChannelType.GuildAnnouncement;

  return (
    validType &&
    typeof candidate.send === "function" &&
    typeof candidate.permissionsFor === "function"
  );
}

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "An unexpected error occurred.";
}
