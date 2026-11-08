export { prisma } from "./client";
export { PrismaClient } from "@prisma/client";

// Re-export generated types for convenience
export type {
  GuildConfig,
  Ticket,
  ModerationCase,
  RoleMenu,
  RoleMenuOption,
  EmbedTemplate,
  Poll,
  Reminder,
  ScheduledEvent,
  IntegrationConfig,
} from "@prisma/client";
