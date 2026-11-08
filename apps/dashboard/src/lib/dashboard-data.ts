import { prisma, type GuildConfig, type Ticket } from "@vezbot/database";

export async function getOrCreateDashboardGuildConfig(guildId: string): Promise<GuildConfig> {
  return prisma.guildConfig.upsert({
    where: { guildId },
    update: {},
    create: { guildId },
  });
}

export async function getTicketDashboardData(guildId: string) {
  const [config, openCount, closedCount, totalCount, recentTickets] = await Promise.all([
    getOrCreateDashboardGuildConfig(guildId),
    prisma.ticket.count({
      where: {
        guildId,
        status: "OPEN",
      },
    }),
    prisma.ticket.count({
      where: {
        guildId,
        status: "CLOSED",
      },
    }),
    prisma.ticket.count({
      where: {
        guildId,
      },
    }),
    prisma.ticket.findMany({
      where: {
        guildId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return {
    config,
    stats: {
      openCount,
      closedCount,
      totalCount,
    },
    recentTickets,
  };
}

export function formatDashboardDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function isSnowflake(value: string) {
  return /^\d{17,20}$/.test(value);
}

export function normalizeSnowflakeInput(formData: FormData, field: string) {
  const rawValue = formData.get(field);

  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue.trim();

  if (!value) {
    return null;
  }

  if (!isSnowflake(value)) {
    throw new Error(`Invalid snowflake for ${field}`);
  }

  return value;
}

export function getTicketStatusTone(status: Ticket["status"]) {
  switch (status) {
    case "OPEN":
      return "text-success";
    case "CLOSED":
      return "text-warning";
    case "ARCHIVED":
      return "text-muted";
    default:
      return "text-muted-foreground";
  }
}
