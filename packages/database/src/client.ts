import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 * In development, reuse via globalThis to survive HMR restarts.
 * In production, create one instance and reuse.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
