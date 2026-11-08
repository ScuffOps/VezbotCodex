import { env } from "@vezbot/config";
import { prisma } from "@vezbot/database";
import { logger } from "@vezbot/discord";
import { createBotClient } from "./lib/client";
import { loadCommands, loadEvents } from "./lib/command-loader";
import { startControlApiServer } from "./lib/control-api";
import { setLoggingClient } from "./services/logging.service";
import { startScheduler } from "./services/scheduler.service";

async function main() {
  logger.info("╔══════════════════════════════════════════╗");
  logger.info("║  Vezbot — Starting up                    ║");
  logger.info("╚══════════════════════════════════════════╝");

  // 1. Verify database connectivity
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (error) {
    logger.fatal({ error }, "Failed to connect to database. Check DATABASE_URL.");
    process.exit(1);
  }

  // 2. Create Discord client
  const client = createBotClient();
  const controlApiServer = startControlApiServer(client);
  const stopScheduler = startScheduler(client);

  // 3. Register client with logging service (avoids circular imports)
  setLoggingClient(client);

  // 4. Load commands and events
  await loadCommands(client);
  await loadEvents(client);

  // 5. Login to Discord
  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    logger.fatal({ error }, "Failed to login to Discord. Check DISCORD_TOKEN.");
    await prisma.$disconnect();
    process.exit(1);
  }

  // 5. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    controlApiServer.close();
    stopScheduler();
    client.destroy();
    await prisma.$disconnect();
    logger.info("Shutdown complete.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Catch unhandled errors — log them, don't crash
  process.on("unhandledRejection", (error) => {
    logger.error({ error }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught exception — shutting down");
    shutdown("uncaughtException");
  });
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
