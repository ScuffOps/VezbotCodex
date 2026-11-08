# Repo Guide

## Purpose

This repository is `VezbotCodex`, a pnpm monorepo for the `Vezbot_FIN` Discord bot and dashboard. The codebase centers on two deployable apps in `apps/*` and shared workspace packages in `packages/*`.

## Repo Map

- `apps/bot`: main Discord bot service
- `apps/bot/src/commands`: slash commands grouped into `admin`, `moderation`, `tickets`, and `utility`
- `apps/bot/src/events`: Discord event handlers such as `ready`, `interaction-create`, `guild-create`, and member join or leave hooks
- `apps/bot/src/services`: business logic for tickets, roles, moderation, logging, and guild config
- Scheduler and native poll runtime: `apps/bot/src/services/scheduler.service.ts` and `poll.service.ts`; timezone conversion is in `packages/shared/src/scheduling.ts`.
- `docs/SPEC_PROGRESS.md` tracks coverage and explicit gaps against the original Vezbot README.
- `apps/bot/src/lib`: client bootstrap, command loading, and slash-command registration
- `apps/bot/src/integrations`: integration registry scaffolding
- `apps/dashboard`: Next.js dashboard service with Discord OAuth and guild-scoped admin pages
- `apps/dashboard/src/app`: App Router routes for login, guild selection, dashboard pages, and health checks
- `apps/dashboard/src/lib`: Discord OAuth helpers, guild authorization helpers, Prisma-backed dashboard data access, and bot API helpers
- live dashboard segments currently include `settings`, `tickets`, `embeds`, `polls`, `verification`, `roles`, `moderation`, `reminders`, `twitch`, and `branding`
- `packages/config`: environment loading and validation
- `packages/database`: Prisma schema, generated client entry points, and database scripts
- `packages/discord`: shared Discord-facing utilities such as embeds, forms, permissions, and logging helpers
- `packages/shared`: shared types and constants
- `railway.toml`: shared Railway build and deploy commands for both bot and dashboard services, split by `RAILWAY_SERVICE_NAME`
- `.env.example`: required runtime environment template

## Workspace Commands

- `pnpm dev`: run the bot in watch mode
- `pnpm dashboard:dev`: run the dashboard locally
- `pnpm build`: build shared packages and the bot in dependency order
- `pnpm dashboard:build`: generate Prisma client, build shared DB package, and build the dashboard
- `pnpm start`: start the built bot
- `pnpm dashboard:start`: start the built dashboard
- `pnpm register-commands`: register slash commands
- `pnpm --filter bot test`: run scheduling and poll/reminder regression checks after building the workspace
- `pnpm --filter dashboard test`: run dashboard guild-lookup regression tests
- `pnpm db:generate`: generate Prisma client
- `pnpm db:migrate:dev`: create and apply local Prisma migrations
- `pnpm db:migrate:deploy`: apply deploy-time Prisma migrations

## Code Expectations

- Make changes from the repo root unless a subpackage-specific command is required.
- Keep package boundaries intact: config in `packages/config`, persistence in `packages/database`, shared Discord presentation logic in `packages/discord`, and cross-package types or constants in `packages/shared`.
- For bot features, wire behavior through the existing `commands`, `events`, and `services` layout instead of adding ad hoc entry points.
- For dashboard features, prefer server components or server actions for DB-backed configuration, and use the bot control API for live Discord-side actions.
- Treat embeds, polls, verification, roles, and moderation dashboard pages as production paths, not placeholders.
- Keep live Discord mutations in the bot service. The dashboard may stage or collect input, but operational Discord actions should flow through the bot control API.
- For live validation, prefer non-destructive Discord checks first: `/ping`, `/about`, and `/server-config view`. Do not create tickets, post panels, mutate roles, or run moderation actions unless the user explicitly asks.
- Treat `node_modules` as generated content and avoid editing it.

## Skills

Load skills only when the task needs them.

- Load `.agent/skills/github` for `gh` auth, remotes, repo inspection, branches, PRs, issues, workflow runs, releases, or pushes.
- Load `.agent/skills/railway` for Railway login, project linking, environment variables, logs, status, or deploys.
- Load `.agent/skills/context7-cli` when current library docs, package APIs, version-sensitive setup steps, or external tool usage need fresh documentation instead of model memory.
- Load `.agent/skills/playwright-cli` for browser automation, login flows, screenshots, DOM-level repros, or dashboard UI verification. Prefer visible non-headless sessions unless the task explicitly calls for headless automation.
- Load both skills for deployment flows that cross GitHub and Railway.
- Load `context7-cli` alongside other skills when GitHub, Railway, Prisma, Discord, TypeScript, or other third-party tooling needs up-to-date docs during implementation or debugging.
- Load `playwright-cli` alongside app work when validating dashboard flows, OAuth redirects, or user-facing browser interactions end to end.
- Do not load a skill for normal TypeScript, Prisma, or Discord bot code changes unless the task explicitly touches GitHub or Railway operations.

## Skill Paths

- `.agent/skills` is a junction to `.codex/skills`
- Context7 skill: `.agent/skills/context7-cli`
- GitHub skill: `.agent/skills/github`
- Playwright skill: `.agent/skills/playwright-cli`
- Railway skill: `.agent/skills/railway`

## Delivery Notes

- Prefer concise changes that fit the current monorepo structure.
- Check `railway.toml`, `.env.example`, and the relevant package manifests before changing runtime or deployment behavior.
- If a task depends on external state such as GitHub or Railway project selection, verify the target before taking write actions.
- Railway deploys must be run from the repo root. Use `railway up --service VezbotCodex` for the bot and `railway up --service VezbotDashboard` for the dashboard.
- Dashboard auth depends on the Discord OAuth callback URL matching `https://vezbotdashboard-production.up.railway.app/api/auth/callback/discord` or the current `NEXTAUTH_URL` equivalent.
- Discord's OAuth provider must set `issuer: "https://discord.com"` to validate the `iss` callback parameter. Keep issuer validation enabled.
- Discord guild lookups share a bounded, credential-isolated 30-second memory cache. Treat API failures separately from an empty server list; never suggest inviting the bot as a remedy for HTTP 429.
- As of 2026-11-08, both Railway app services follow `ScuffOps/VezbotCodex` branch `codex/dashboard-recovery-20261108`. The default branch does not contain the dashboard; verify source contents before changing the deployment branch.
- When using Playwright for live validation, keep the dashboard and Discord in separate tabs and prefer visible non-headless sessions.
- When Discord shows `The application did not respond` but the bot health endpoint is healthy, compare the live failure with `railway logs --service VezbotCodex --since 10m`. If no interaction logs appear, treat it as Discord app routing or command registration drift before changing bot handlers.
