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

async function fetchDiscordJson<T>(path: string, accessToken: string): Promise<T | null> {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`Discord API request failed for ${path}:`, response.status);
    return null;
  }

  return response.json() as Promise<T>;
}

export function hasDashboardAccess(permissions: string): boolean {
  const bits = BigInt(permissions);
  return (bits & MANAGE_GUILD) !== BigInt(0) || (bits & ADMINISTRATOR) !== BigInt(0);
}

export async function getManageableGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const guilds = await fetchDiscordJson<DiscordGuild[]>("/users/@me/guilds", accessToken);

  if (!guilds) {
    return [];
  }

  return guilds
    .filter((guild) => hasDashboardAccess(guild.permissions))
    .sort((left, right) => left.name.localeCompare(right.name));
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
