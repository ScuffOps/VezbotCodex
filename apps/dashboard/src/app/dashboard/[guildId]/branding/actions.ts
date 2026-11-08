'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@vezbot/database';
import { requireManageableGuildAccess } from '@/lib/dashboard-auth';

function normalizeText(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function parseOptionalUrl(value: string | null) {
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid URL protocol');
  }

  return value;
}

export async function saveBrandingSettingsAction(guildId: string, formData: FormData) {
  await requireManageableGuildAccess(guildId);

  try {
    const enabled = formData.get('enabled') === 'on';
    const brandName = normalizeText(formData, 'brandName');
    const accentColor = normalizeText(formData, 'accentColor');
    const tagline = normalizeText(formData, 'tagline');
    const footerText = normalizeText(formData, 'footerText');
    const supportUrl = parseOptionalUrl(normalizeText(formData, 'supportUrl'));
    const logoUrl = parseOptionalUrl(normalizeText(formData, 'logoUrl'));
    const bannerUrl = parseOptionalUrl(normalizeText(formData, 'bannerUrl'));

    if (brandName && brandName.length > 80) {
      redirect(`/dashboard/${guildId}/branding?error=invalid_payload`);
    }
    if (accentColor && !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
      redirect(`/dashboard/${guildId}/branding?error=invalid_payload`);
    }
    if (tagline && tagline.length > 180) {
      redirect(`/dashboard/${guildId}/branding?error=invalid_payload`);
    }
    if (footerText && footerText.length > 200) {
      redirect(`/dashboard/${guildId}/branding?error=invalid_payload`);
    }

    await prisma.integrationConfig.upsert({
      where: {
        guildId_provider: {
          guildId,
          provider: 'branding',
        },
      },
      update: {
        enabled,
        config: JSON.stringify({
          brandName,
          accentColor,
          tagline,
          footerText,
          supportUrl,
          logoUrl,
          bannerUrl,
        }),
      },
      create: {
        guildId,
        provider: 'branding',
        enabled,
        config: JSON.stringify({
          brandName,
          accentColor,
          tagline,
          footerText,
          supportUrl,
          logoUrl,
          bannerUrl,
        }),
      },
    });
  } catch {
    redirect(`/dashboard/${guildId}/branding?error=invalid_payload`);
  }

  revalidatePath(`/dashboard/${guildId}/branding`);
  redirect(`/dashboard/${guildId}/branding?saved=1`);
}
