export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

const DISCORD_API_BASE = "https://discord.com/api/v10";
const MANAGE_GUILD = BigInt(0x20);
const ADMINISTRATOR = BigInt(0x8);

export class DiscordGuildFetchError extends Error {
  constructor(public readonly status: number) {
    super("Discord server list is temporarily unavailable.");
  }
}

// Briefly share successful lookups across picker, layouts, and pages.
// Credentials never become persistent cache keys or stored cache values.
const guildLookups = new Map<string, { expiresAt: number; promise: Promise<DiscordGuild[]> }>();

async function fetchDiscordJson<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`Discord API request failed for ${path}:`, response.status);
    throw new DiscordGuildFetchError(response.status);
  }

  return response.json() as Promise<T>;
}

export function hasDashboardAccess(permissions: string): boolean {
  const bits = BigInt(permissions);
  return (bits & MANAGE_GUILD) !== BigInt(0) || (bits & ADMINISTRATOR) !== BigInt(0);
}

export async function getManageableGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken));
  const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const cached = guildLookups.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  for (const [cacheKey, entry] of Array.from(guildLookups)) {
    if (entry.expiresAt <= Date.now()) guildLookups.delete(cacheKey);
  }
  if (guildLookups.size >= 100) guildLookups.delete(guildLookups.keys().next().value!);

  const promise = fetchDiscordJson<DiscordGuild[]>("/users/@me/guilds", accessToken)
    .then((guilds) => guilds
      .filter((guild) => hasDashboardAccess(guild.permissions))
      .sort((left, right) => left.name.localeCompare(right.name)));
  guildLookups.set(key, { expiresAt: Date.now() + 30_000, promise });
  try {
    return await promise;
  } catch (error) {
    if (guildLookups.get(key)?.promise === promise) guildLookups.delete(key);
    throw error;
  }
}

export async function getManageableGuild(accessToken: string, guildId: string): Promise<DiscordGuild | null> {
  const guilds = await getManageableGuilds(accessToken);
  return guilds.find((guild) => guild.id === guildId) ?? null;
}

export function getGuildIconUrl(guild: Pick<DiscordGuild, "id" | "icon">): string {
  if (!guild.icon) {
    return "";
  }

  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128`;
}

export function getBotInviteUrl(clientId = process.env.DISCORD_CLIENT_ID): string {
  if (!clientId) {
    return "https://discord.com/developers/applications";
  }

  const scopes = encodeURIComponent("bot applications.commands");
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=${scopes}`;
}
