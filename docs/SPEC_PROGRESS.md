# Original Spec Progress

Source: https://github.com/ScuffOps/VezzyBottyBoiye-Ver1.2.5/blob/baseyboi/README.md

Updated: 2026-11-08. This is a feature inventory, not a claim that every feature has been exercised in production.

## This Release

- Restore the bot's Railway source connection and ship the current TypeScript bot.
- Synchronize known slash commands globally and in connected guilds at startup without deleting unknown commands.
- Publish saved legacy and Component V2 templates with `/embed show` and `/embed send`.
- Apply configured guild accent/footer defaults to legacy saved embeds when the template has no override.
- Store personal timezone preferences with `/timezone set`.
- Create DM or server-channel reminders with `/reminder set`; list pending reminders with `/reminder list`.
- Run a Postgres-backed reminder scheduler every 15 seconds. Atomically claim each reminder, delay failed attempts five minutes, and stop after five attempts. Delivery is at-least-once; a crash after Discord accepts a message can still cause a duplicate on recovery.
- Convert local schedules to UTC with Luxon. Reject ambiguous or nonexistent daylight-saving times unless the input supplies an explicit offset.
- Publish single/multiple-choice native Discord polls with `/poll create` or the dashboard's Publish button. Close polls through the bot API and process scheduled closures.
- Enforce server membership/Manage Server permission in the live poll API, and bind role buttons to persisted role-menu messages.
- Keep Dashboard OAuth, template quick-select presets, settings, moderation notes, and ticket-panel controls.

## Remaining Spec Gaps

| Original feature | Current coverage | Remaining work |
| --- | --- | --- |
| Multi-branding | Stored settings; legacy embed accent/footer defaults | Brand name/logo across all bot surfaces, microcopy voices, tone presets, V2 branding |
| Thread tickets | Private channel tickets and ticket modals | Private threads and automatic thread-to-channel fallback |
| Embeds/webhooks | Saved legacy/V2 templates, dashboard editing/presets, slash preview/send | Dashboard send/preview controls, webhook identities and lifecycle, richer visual builder |
| Polls | Native Discord single/multiple-choice polls and scheduled closing | Anonymous voting is not available for native polls; existing anonymous drafts cannot publish |
| Reminders | UTC storage, IANA zones, delivery claims/retries, personal and channel scheduling | Dashboard rescheduling and explicit retry/cancel controls for claimed/failed deliveries |
| Twitch | Stored provider configuration only | Twitch application credentials, EventSub receiver/signature verification/subscription reconciliation, stream alert delivery |
| Setup wizard | `/setup` shortcuts and module-specific commands | Multi-step interactive wizard |
| Module switches | Existing guild config switches | Dedicated poll/embed/reminder switches enforced consistently |

## Validation

- Bot production TypeScript build and dashboard production build.
- Eight bot regression tests: timezone/DST validation, poll publication/failure, reminder claim/failure.
- Four dashboard regression tests: concurrent guild lookups, credential isolation/expiry, rate limiting, failed-request eviction.
- Check production `/api/health` for `ready`, `commandsSynced`, and the loaded command names.
- Live checks must not run moderation actions or delete server resources. Creating a real ticket/poll/panel or sending a reminder should use an explicitly chosen test destination.

## Operations

- Runtime: Node/TypeScript, discord.js, Prisma/Postgres, Next.js; no Redis.
- Dashboard/bot use the shared root `railway.toml` and are deployed separately.
- OAuth issuer: `https://discord.com`; dashboard callback: `${NEXTAUTH_URL}/api/auth/callback/discord`.
- Never commit credentials or the local `*env*.txt` files.
