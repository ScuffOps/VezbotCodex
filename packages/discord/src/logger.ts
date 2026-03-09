import pino from "pino";

const isProduction = process.env["NODE_ENV"] === "production";

/**
 * Structured logger using pino.
 * - In production: JSON output for machine parsing
 * - In development: Pretty-printed for readability
 */
export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? "info",
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
  // Base fields included in every log entry
  base: {
    service: "vezbot",
  },
});

/** Create a child logger with context (guild, command, user, etc.) */
export function createLogger(context: Record<string, string | undefined>) {
  return logger.child(context);
}
