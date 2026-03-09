# VezbotCodex

A production-grade Discord bot platform — monorepo with per-guild configuration, moderation, tickets, role menus, and integration-ready architecture. Designed for Railway deployment.

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL database (local or Railway-provisioned)
- Discord bot application ([Developer Portal](https://discord.com/developers/applications))

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/VezbotCodex.git
cd VezbotCodex
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your DISCORD_TOKEN, DISCORD_CLIENT_ID, DATABASE_URL
```

### 3. Setup Database
```bash
pnpm db:migrate:dev    # Creates initial migration
pnpm db:generate       # Generates Prisma client
```

### 4. Register Commands
```bash
pnpm register-commands
```
> Global commands take up to 1 hour to propagate. For instant testing, modify `register-commands.ts` to use guild-specific registration.

### 5. Run
```bash
pnpm dev    # Development with hot reload
pnpm build  # Production build
pnpm start  # Production start
```

---

## Railway Deployment

1. Push to GitHub
2. Create a new Railway project
3. Provision PostgreSQL in the project
4. Add a new service → connect your GitHub repo
5. Add environment variables:
   - `DISCORD_TOKEN` — Bot token
   - `DISCORD_CLIENT_ID` — Application ID
   - `DATABASE_URL` — Copy from Railway PostgreSQL service
6. Deploy — `railway.toml` handles build + migration + start automatically

The bot runs as a single Railway service. The optional web dashboard can be added as a separate service later.

---

## Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to **Bot** tab → click **Reset Token** → copy the token to your `.env`
4. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
5. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Manage Channels`, `Manage Roles`, `Moderate Members`, `Send Messages`, `View Channels`, `Embed Links`, `Read Message History`, `Manage Messages`
6. Copy the generated URL and invite the bot to your server

---

## Project Structure

```
VezbotCodex/
├── apps/
│   ├── bot/                    # Discord bot (main service)
│   │   └── src/
│   │       ├── commands/       # Slash commands by category
│   │       ├── events/         # Discord event handlers
│   │       ├── services/       # Business logic layer
│   │       ├── integrations/   # Integration module registry
│   │       └── lib/            # Client, loaders, registration
│   └── web/                    # Dashboard (optional, scaffolded)
├── packages/
│   ├── config/                 # Zod-validated environment variables
│   ├── database/               # Prisma schema + singleton client
│   ├── shared/                 # Types, constants, feature flags
│   └── discord/                # Embeds, forms, permissions, logger
├── railway.toml                # Railway deployment config
├── .env.example                # Environment variable template
└── pnpm-workspace.yaml         # Workspace configuration
```

---

## Available Commands

| Command | Category | Description |
|---|---|---|
| `/ping` | Utility | Bot health check with latency |
| `/about` | Utility | Bot info, server count, uptime |
| `/server-config view` | Admin | View all guild settings |
| `/server-config set-log-channel` | Admin | Set general log channel |
| `/server-config set-mod-log` | Admin | Set moderation log channel |
| `/server-config set-mod-role` | Admin | Set moderator role |
| `/server-config toggle` | Admin | Toggle features on/off |
| `/setup-tickets` | Admin | Configure ticket system |
| `/setup-roles` | Admin | Create a self-role menu |
| `/ticket` | Tickets | Create a support ticket |
| `/close-ticket` | Tickets | Close current ticket |
| `/warn` | Moderation | Issue a warning |
| `/timeout` | Moderation | Timeout a member |
| `/case history` | Moderation | View case history for a user |
| `/case view` | Moderation | View a specific case |
| `/report` | Moderation | Report a user/issue |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application ID |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NODE_ENV` | ❌ | `development` / `production` (default: `production`) |
| `LOG_LEVEL` | ❌ | `debug` / `info` / `warn` / `error` (default: `info`) |
| `DISCORD_CLIENT_SECRET` | Dashboard | For OAuth |
| `NEXTAUTH_SECRET` | Dashboard | Session encryption |
| `NEXTAUTH_URL` | Dashboard | Dashboard public URL |

---

## What's Implemented vs Scaffolded

### ✅ Fully Working
- Slash command framework with dynamic loading
- Per-guild configuration with feature toggles (PostgreSQL)
- Themed embed builder (success/error/warning/info/moderation/ticket variants)
- Reusable modal/form engine with Zod validation
- Ticket system (create, close, permission locking, transcript, logging)
- Role menu system (button-based self-roles with hierarchy safety)
- Moderation commands (warn, timeout, case tracking, DM notifications)
- User report system (modal → mod log channel)
- Member join/leave logging
- Structured logger (pino)
- Railway deployment config
- Graceful shutdown, error boundaries, ephemeral error feedback

### 🏗️ Scaffolded / Foundation
- Integration registry (Twitch, YouTube, Twitter, TikTok, Google Calendar — architecture ready, no API calls yet)
- Reminder/event system (database models ready, no active scheduler yet)
- Web dashboard (not included — add as separate Railway service when needed)

---

## License

MIT
