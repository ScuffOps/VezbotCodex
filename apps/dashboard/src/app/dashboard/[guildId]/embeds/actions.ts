'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';
import { normalizeSnowflakeInput } from '@/lib/dashboard-data';

const EMBED_PRESETS = {
  rules_shinra_v2: {
    name: 'rules_shinra_v2',
    title: 'Rules',
    description: null,
    colorHex: '#2B2E58',
    footerText: null,
    channelId: null,
    imageUrl: null,
    thumbnailUrl: null,
    content: null,
    componentsV2Enabled: true,
    componentsJson: JSON.stringify([
      {
        type: 10,
        content:
          '☑\n\n__001.__ — ➤ follow **tos** & **gdlns**.\n\n__002.__ — ➤ 14+ server; if we find out you are lying and are younger you will be banned.\n\n__003.__ — ➤ no nsfw; small jokes & teasing comments are fine, **no pornographic and gore** material.\n\n__004.__ — ➤ no spamming or self promo unless given the okay by staff.\n\n__005.__ — ➤ be respectful to members; no racism, homophobia, doxxing, or threats.\n\n__006.__ — ➤ if you think you were wrongly banned or kicked, please message an owner.',
      },
    ]),
  },
  rules_soft_v2: {
    name: 'rules_soft_v2',
    title: 'Rules',
    description: null,
    colorHex: '#1E2233',
    footerText: null,
    channelId: null,
    imageUrl: null,
    thumbnailUrl: null,
    content: null,
    componentsV2Enabled: true,
    componentsJson: JSON.stringify([
      {
        type: 10,
        content:
          '平静 、 𖠿 ︵ （o\'□\'o）! ✶\n\n❀ ။  -  server ruℓes.\n\n୨୧  rule  **001**  ❀\n___ txt txt txt txt txt txt txt txt txt txt\n txt txt txt txt txt txt txt txt txt txt txt txt\n txt txt txt txt txt txt txt\n\n୨୧  rule  **002**  ❀\n___ txt txt txt txt txt txt txt txt txt txt\n txt txt txt txt txt txt txt txt txt txt txt txt\n txt txt txt txt txt txt txt',
      },
    ]),
  },
} as const;

function normalizeText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function normalizeColorHex(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim().replace(/^#/, '');
  if (!value) return null;
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error('Invalid color hex');
  }
  return `#${value.toUpperCase()}`;
}

function normalizeHttpUrl(raw: string | null) {
  if (!raw) return null;

  const value = raw.trim();
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid URL protocol');
  }

  return parsed.toString();
}

function parseComponentsJson(raw: string | null) {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Invalid components JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Components must be a JSON array');
  }

  if (parsed.length > 40) {
    throw new Error('Too many components');
  }

  return JSON.stringify(parsed);
}

function isPrismaCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (error as { code: string }).code === code
  );
}

export async function saveEmbedTemplateAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const templateId = normalizeText(formData, 'templateId');
  const name = normalizeText(formData, 'name');
  const title = normalizeText(formData, 'title');
  const description = normalizeText(formData, 'description');
  const footerText = normalizeText(formData, 'footerText');
  const content = normalizeText(formData, 'content');
  const componentsV2Enabled = formData.get('componentsV2Enabled') === 'on';
  let componentsJson: string | null = null;

  if (
    !name ||
    name.length < 2 ||
    name.length > 60 ||
    (content && content.length > 2000) ||
    !title ||
    title.length > 256 ||
    (description && description.length > 4000) ||
    (footerText && footerText.length > 2048)
  ) {
    redirect(`/dashboard/${guildId}/embeds?error=invalid_payload`);
  }

  try {
    componentsJson = parseComponentsJson(normalizeText(formData, 'componentsJson'));
    if (componentsV2Enabled && !componentsJson) {
      redirect(`/dashboard/${guildId}/embeds?error=components_required`);
    }

    const payload = {
      name,
      content,
      title,
      description,
      colorHex: normalizeColorHex(normalizeText(formData, 'colorHex')),
      footerText,
      channelId: normalizeSnowflakeInput(formData, 'channelId'),
      imageUrl: normalizeHttpUrl(normalizeText(formData, 'imageUrl')),
      thumbnailUrl: normalizeHttpUrl(normalizeText(formData, 'thumbnailUrl')),
      componentsV2Enabled,
      componentsJson,
    };

    if (templateId) {
      const existing = await prisma.embedTemplate.findFirst({
        where: { id: templateId, guildId },
        select: { id: true },
      });
      if (!existing) {
        redirect(`/dashboard/${guildId}/embeds?error=not_found`);
      }

      await prisma.embedTemplate.update({
        where: { id: templateId },
        data: payload,
      });
    } else {
      await prisma.embedTemplate.create({
        data: {
          guildId,
          ...payload,
        },
      });
    }
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      redirect(`/dashboard/${guildId}/embeds?error=duplicate_name`);
    }
    redirect(`/dashboard/${guildId}/embeds?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/embeds`);
  redirect(`/dashboard/${guildId}/embeds?saved=1`);
}

export async function deleteEmbedTemplateAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const templateId = normalizeText(formData, 'templateId');
  if (!templateId) {
    redirect(`/dashboard/${guildId}/embeds?error=invalid_payload`);
  }

  await prisma.embedTemplate.deleteMany({
    where: { id: templateId, guildId },
  });

  revalidatePath(`/dashboard/${guildId}/embeds`);
  redirect(`/dashboard/${guildId}/embeds?deleted=1`);
}

export async function createEmbedPresetAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  const presetId = normalizeText(formData, 'presetId');
  if (!presetId || !(presetId in EMBED_PRESETS)) {
    redirect(`/dashboard/${guildId}/embeds?error=invalid_payload`);
  }

  const preset = EMBED_PRESETS[presetId as keyof typeof EMBED_PRESETS];

  try {
    const existingCount = await prisma.embedTemplate.count({
      where: {
        guildId,
        name: {
          startsWith: preset.name,
          mode: 'insensitive',
        },
      },
    });

    const finalName = existingCount === 0 ? preset.name : `${preset.name}_${existingCount + 1}`;

    await prisma.embedTemplate.create({
      data: {
        guildId,
        ...preset,
        name: finalName,
      },
    });
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      redirect(`/dashboard/${guildId}/embeds?error=duplicate_name`);
    }
    redirect(`/dashboard/${guildId}/embeds?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/embeds`);
  redirect(`/dashboard/${guildId}/embeds?preset=1`);
}
