import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { env } from "@vezbot/config";
import { createLogger } from "@vezbot/discord";
import type { BotClient } from "./client";
import { postTicketPanel } from "../services/ticket-panel.service";
import { PermissionFlagsBits } from "discord.js";
import { z } from "zod";
import { setLivePollStatus } from "../services/poll.service";

const log = createLogger({ service: "control-api" });

interface TicketPanelRequest {
  guildId?: string;
  userId?: string;
  panelChannelId?: string;
  title?: string;
  description?: string;
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(payload));
}

async function readJson<T>(req: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(body) as T;
}

function isAuthorized(req: IncomingMessage) {
  if (!env.BOT_API_SECRET) {
    return { ok: false, statusCode: 503, error: "BOT_API_SECRET is not configured." };
  }

  const apiKey = req.headers["x-api-key"];
  if (apiKey !== env.BOT_API_SECRET) {
    return { ok: false, statusCode: 401, error: "Unauthorized" };
  }

  return { ok: true as const };
}

export function startControlApiServer(client: BotClient) {
  const server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        writeJson(res, 400, { error: "Invalid request." });
        return;
      }

      const url = new URL(req.url, `http://127.0.0.1:${env.PORT}`);

      if ((url.pathname === "/api/internal/health" || url.pathname === "/api/health") && req.method === "GET") {
        writeJson(res, 200, {
          status: "ok",
          ready: client.isReady(),
          guildCount: client.guilds.cache.size,
          commandsSynced: client.commandsSynced,
          commands: [...client.commands.keys()].sort(),
        });
        return;
      }

      const auth = isAuthorized(req);
      if (!auth.ok) {
        writeJson(res, auth.statusCode, { error: auth.error });
        return;
      }

      if (url.pathname === "/api/internal/polls/status" && req.method === "POST") {
        if (!client.isReady()) { writeJson(res, 503, { error: "Bot is not ready." }); return; }
        const schema = z.object({ guildId: z.string().regex(/^\d{17,20}$/), userId: z.string().regex(/^\d{17,20}$/), pollId: z.string().min(1).max(40), status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]) });
        const body = schema.safeParse(await readJson<unknown>(req));
        if (!body.success) { writeJson(res, 400, { error: "Invalid poll request." }); return; }
        const guild = await client.guilds.fetch(body.data.guildId).catch(() => null);
        const member = guild ? await guild.members.fetch(body.data.userId).catch(() => null) : null;
        if (!guild || !member?.permissions.has(PermissionFlagsBits.ManageGuild)) { writeJson(res, 403, { error: "Manage Server permission is required." }); return; }
        try {
          await setLivePollStatus(guild, body.data.pollId, body.data.status);
          writeJson(res, 200, { success: true });
        } catch {
          writeJson(res, 400, { error: "Poll could not be published or closed. Check channel, poll options, duration, and bot permissions." });
        }
        return;
      }

      if (url.pathname === "/api/internal/tickets/panel" && req.method === "POST") {
        if (!client.isReady()) {
          writeJson(res, 503, { error: "Bot client is not ready yet." });
          return;
        }

        const body = await readJson<TicketPanelRequest>(req);

        if (!body?.guildId || !body.userId || !body.panelChannelId) {
          writeJson(res, 400, { error: "guildId, userId, and panelChannelId are required." });
          return;
        }

        const guild = await client.guilds.fetch(body.guildId).catch(() => null);
        if (!guild) {
          writeJson(res, 404, { error: "Guild not found." });
          return;
        }

        const result = await postTicketPanel(
          guild,
          body.userId,
          body.panelChannelId,
          body.title?.trim() || "Support Tickets",
          body.description?.trim() ||
            "Use the button below to open a ticket and get help from the server team."
        );

        if (!result.success) {
          writeJson(res, 400, { error: result.error });
          return;
        }

        writeJson(res, 200, {
          success: true,
          messageId: result.messageId,
        });
        return;
      }

      writeJson(res, 404, { error: "Not found" });
    } catch (error) {
      log.error({ error, method: req.method, url: req.url }, "Control API request failed");
      writeJson(res, 500, { error: "Internal server error" });
    }
  });

  server.listen(Number(env.PORT), "0.0.0.0", () => {
    log.info({ port: env.PORT, controlApi: Boolean(env.BOT_API_SECRET) }, "Control API server listening");
  });

  return server;
}
