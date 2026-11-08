# Changelog

## 2026-11-08

- added persistent timezone preferences, DST-aware scheduling, reminder delivery claims/retries, and native poll publication/closing
- added `/timezone set`, `/reminder set`, `/reminder list`, and `/poll create`, with startup synchronization of known slash commands
- added bot runtime feature diagnostics, persisted role-menu button checks, and guild branding defaults for saved legacy embeds
- added eight bot regression tests and a feature-by-feature original-spec coverage document

- restored Railway dashboard deployments by publishing dashboard source and connecting the recovery branch
- configured the Discord OAuth issuer to support issuer validation in authorization callbacks
- shared guild-list requests briefly across dashboard routes and distinguished Discord API failures from an empty server list
- added four passing regression tests covering concurrent lookups, credential isolation, expiration, rate limiting, and failed-request eviction

## 2026-04-05

- rolled out live dashboard modules for `branding`, `reminders`, and `twitch` with Prisma-backed persistence and validated server actions
- replaced staged placeholders with production forms, list views, and per-guild access-guarded workflows
- updated dashboard navigation and overview rollout labels so all current modules show live status
- refreshed `AGENTS.md` and implementation planning docs to reflect the expanded live dashboard surface

## 2026-05-05

- added embed template support for message content and Component V2 payload JSON (`components_v2_enabled` + `components_json`)
- updated dashboard embed template editor and server action validation to configure V2 templates safely
- updated bot `/embed show` and `/embed send` flows to render and dispatch Component V2 templates with `MessageFlags.IsComponentsV2`
- rolled out the missing moderator application modal flow via new `/mod-apply` command and modal submit handling in the interaction event pipeline
- added a dashboard "quick template library" section for one-click creation of stored V2 rules presets

## 2026-03-28

- delivered live dashboard segments for embeds, polls, verification, reaction roles, and moderation notes
- added Prisma schema and migration support for `embed_templates` and `polls`
- hardened dashboard server actions with stronger payload validation and conflict-aware error handling
- updated plan and notes docs to track Phase 4 dashboard progress
- validated production dashboard build with `corepack pnpm --filter dashboard build`

## 2026-03-16

- added repo-local Playwright skill wiring and updated agent guidance for non-headless browser validation
- validated local bot and dashboard builds successfully with `pnpm build` and `pnpm dashboard:build`
- verified live Railway health endpoints for the bot and dashboard
- exercised the live dashboard across guild selection, overview, settings, tickets, and staged placeholder pages
- removed misleading staged-page fallback command hints for features that do not exist yet
- updated dashboard overview and tickets copy to reflect the current live/staged split more accurately
- aligned shared bot branding constants to `Vezbot_FIN`
- added bot interaction receipt logging for chat commands, buttons, and modals
- confirmed a live blocker: Discord slash commands for `Vezmir` still time out with `The application did not respond`, while the current Railway bot service shows no matching interaction receipt
