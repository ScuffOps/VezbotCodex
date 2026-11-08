import { config } from "dotenv";
import { z } from "zod";
import { resolve } from "path";

// Load .env from monorepo root in development
if (process.env["NODE_ENV"] !== "production") {
  config({ path: resolve(__dirname, "../../../.env") });
}

const envSchema = z.object({
  // Required — bot will not start without these
  DISCORD_TOKEN: z
    .string()
    .min(1, "DISCORD_TOKEN is required. Get it from Discord Developer Portal → Bot → Token"),
  DISCORD_CLIENT_ID: z
    .string()
    .min(1, "DISCORD_CLIENT_ID is required. Get it from Discord Developer Portal → General Information → Application ID"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Format: postgresql://user:password@host:5432/dbname"),

  // Optional — sensible defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PORT: z.string().regex(/^\d+$/).default("3001"),

  // Dashboard-only (not required for bot)
  DISCORD_CLIENT_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Internal control plane
  BOT_API_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("╔══════════════════════════════════════════╗");
    console.error("║  ENVIRONMENT VALIDATION FAILED           ║");
    console.error("╚══════════════════════════════════════════╝");
    console.error("");

    for (const issue of result.error.issues) {
      console.error(`  ✗ ${issue.path.join(".")}: ${issue.message}`);
    }

    console.error("");
    console.error("  Copy .env.example to .env and fill in required values.");
    console.error("");
    process.exit(1);
  }

  return result.data;
}

/** Validated environment variables — safe to use throughout the application */
export const env = validateEnv();
