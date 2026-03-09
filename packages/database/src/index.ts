export { prisma } from "./client";
export { PrismaClient } from "@prisma/client";

// Re-export generated types for convenience
export type {
  GuildConfig,
  Ticket,
  ModerationCase,
  RoleMenu,
  RoleMenuOption,
  Reminder,
  ScheduledEvent,
  IntegrationConfig,
} from "@prisma/client";
